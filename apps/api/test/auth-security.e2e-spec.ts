import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TokenService } from '../src/modules/auth/token.service';
import { OtpService } from '../src/modules/auth/otp.service';
import { RoleCode, UserStatus } from '@prisma/client';

describe('Auth & Authorization Security Bypass (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let tokens: TokenService;
  let otp: OtpService;

  let testCustomerUser: any;
  let testAdminUser: any;

  beforeAll(async () => {
    process.env.ALLOW_FIXED_TEST_OTP = 'true';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    tokens = app.get(TokenService);
    otp = app.get(OtpService);

    // Create test customer role if missing
    let customerRole = await prisma.role.findUnique({ where: { code: RoleCode.CUSTOMER } });
    if (!customerRole) {
      customerRole = await prisma.role.create({
        data: { code: RoleCode.CUSTOMER, name: 'Customer' },
      });
    }

    let adminRole = await prisma.role.findUnique({ where: { code: RoleCode.ADMIN } });
    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: { code: RoleCode.ADMIN, name: 'Admin' },
      });
    }

    // Seed test users
    const phoneCustomer = `+919999${Math.floor(100000 + Math.random() * 900000)}`;
    testCustomerUser = await prisma.user.create({
      data: {
        phone: phoneCustomer,
        status: UserStatus.ACTIVE,
        roles: { create: { roleId: customerRole.id } },
      },
      include: { roles: { include: { role: true } } },
    });

    const phoneAdmin = `+918888${Math.floor(100000 + Math.random() * 900000)}`;
    testAdminUser = await prisma.user.create({
      data: {
        phone: phoneAdmin,
        status: UserStatus.ACTIVE,
        roles: { create: { roleId: adminRole.id } },
      },
      include: { roles: { include: { role: true } } },
    });
  });

  afterAll(async () => {
    if (testCustomerUser?.id) {
      await prisma.user.delete({ where: { id: testCustomerUser.id } }).catch(() => {});
    }
    if (testAdminUser?.id) {
      await prisma.user.delete({ where: { id: testAdminUser.id } }).catch(() => {});
    }
    await app.close();
  });

  describe('JWT Access Token Security', () => {
    it('rejects requests with missing authorization token on protected routes', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/prescriptions').expect(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects requests with fake / tampered JWT token', async () => {
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZXMiOlsidXNlciJdfQ.invalid_signature';
      const res = await request(app.getHttpServer())
        .get('/api/v1/prescriptions')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects requests with an expired JWT token', async () => {
      const expiredToken = await jwt.signAsync(
        { sub: testCustomerUser.id, roles: [RoleCode.CUSTOMER] },
        { secret: process.env.JWT_ACCESS_SECRET || 'dev_jwt_secret_min_16_chars', expiresIn: '-1s' },
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/prescriptions')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Refresh Token Rotation & Revocation Security', () => {
    it('supports refresh token rotation and invalidates old token', async () => {
      const issued = await tokens.issue(testCustomerUser.id, [RoleCode.CUSTOMER]);

      // First refresh call should succeed and rotate token
      const refreshRes = await request(app.getHttpServer())
        .post('/api/v1/auth/token/refresh')
        .send({ refreshToken: issued.refreshToken })
        .expect(200);

      expect(refreshRes.body.data.tokens.accessToken).toBeDefined();
      const newRefreshToken = refreshRes.body.data.tokens.refreshToken;
      expect(newRefreshToken).not.toEqual(issued.refreshToken);

      // Replay attack attempt: Using the old revoked refresh token MUST fail
      const replayRes = await request(app.getHttpServer())
        .post('/api/v1/auth/token/refresh')
        .send({ refreshToken: issued.refreshToken })
        .expect(401);

      expect(replayRes.body.success).toBe(false);
    });

    it('permits only one of two concurrent refresh attempts for the same token', async () => {
      const issued = await tokens.issue(testCustomerUser.id, [RoleCode.CUSTOMER]);
      const responses = await Promise.all([
        request(app.getHttpServer()).post('/api/v1/auth/token/refresh').send({ refreshToken: issued.refreshToken }),
        request(app.getHttpServer()).post('/api/v1/auth/token/refresh').send({ refreshToken: issued.refreshToken }),
      ]);

      expect(responses.filter((response) => response.status === 200)).toHaveLength(1);
      expect(responses.filter((response) => response.status === 401)).toHaveLength(1);
    });

    it('revokes all sessions on logout / session revocation', async () => {
      const issued = await tokens.issue(testCustomerUser.id, [RoleCode.CUSTOMER]);

      // Call logout
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({ refreshToken: issued.refreshToken })
        .expect(200);

      // Attempting to refresh using logged out token MUST fail
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/token/refresh')
        .send({ refreshToken: issued.refreshToken })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('OTP Security Controls', () => {
    const testDestination = `+917000${Math.floor(100000 + Math.random() * 900000)}`;

    it('enforces 60-second resend cooldown limit', async () => {
      // First request succeeds
      await request(app.getHttpServer())
        .post('/api/v1/auth/otp/request')
        .send({ channel: 'PHONE', destination: testDestination, purpose: 'LOGIN' })
        .expect(201);

      // Second immediate request MUST trigger 429 TOO_MANY_REQUESTS
      const cooldownRes = await request(app.getHttpServer())
        .post('/api/v1/auth/otp/request')
        .send({ channel: 'PHONE', destination: testDestination, purpose: 'LOGIN' })
        .expect(429);

      expect(cooldownRes.body.code || cooldownRes.body.error).toBeDefined();
    });

    it('enforces max verification attempts limit and invalidates challenge on lockout', async () => {
      const lockoutDest = `+916000${Math.floor(100000 + Math.random() * 900000)}`;

      await request(app.getHttpServer())
        .post('/api/v1/auth/otp/request')
        .send({ channel: 'PHONE', destination: lockoutDest, purpose: 'LOGIN' })
        .expect(201);

      // Submit 5 invalid attempts
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/otp/verify')
          .send({ channel: 'PHONE', destination: lockoutDest, purpose: 'LOGIN', code: '000000' })
          .expect(401);
      }

      // 6th attempt even with correct code MUST fail because challenge was invalidated
      const lockedRes = await request(app.getHttpServer())
        .post('/api/v1/auth/otp/verify')
        .send({ channel: 'PHONE', destination: lockoutDest, purpose: 'LOGIN', code: '123456' })
        .expect(401);

      expect(lockedRes.body.message).toContain('attempts');
    });

    it('enforces single-use policy and prevents OTP reuse', async () => {
      const reuseDest = `+915000${Math.floor(100000 + Math.random() * 900000)}`;

      await request(app.getHttpServer())
        .post('/api/v1/auth/otp/request')
        .send({ channel: 'PHONE', destination: reuseDest, purpose: 'LOGIN' })
        .expect(201);

      // Verify OTP successfully first time
      await request(app.getHttpServer())
        .post('/api/v1/auth/otp/verify')
        .send({ channel: 'PHONE', destination: reuseDest, purpose: 'LOGIN', code: '123456' })
        .expect(201);

      // Second verification attempt with same OTP MUST fail
      await request(app.getHttpServer())
        .post('/api/v1/auth/otp/verify')
        .send({ channel: 'PHONE', destination: reuseDest, purpose: 'LOGIN', code: '123456' })
        .expect(401);
    });
  });

  describe('RBAC Authorization Guards Enforcement', () => {
    it('blocks CUSTOMER user from accessing ADMIN protected route (403 Forbidden)', async () => {
      const customerTokens = await tokens.issue(testCustomerUser.id, [RoleCode.CUSTOMER]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/status')
        .set('Authorization', `Bearer ${customerTokens.accessToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Insufficient role');
    });

    it('allows ADMIN user to access ADMIN protected route', async () => {
      const adminTokens = await tokens.issue(testAdminUser.id, [RoleCode.ADMIN]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/status')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('active');
    });
  });

  describe('Authenticated identity propagation', () => {
    it('passes the JWT subject to endpoints that request CurrentUser(\'id\')', async () => {
      const customerTokens = await tokens.issue(testCustomerUser.id, [RoleCode.CUSTOMER]);
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerTokens.accessToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(testCustomerUser.id);
    });
  });
});
