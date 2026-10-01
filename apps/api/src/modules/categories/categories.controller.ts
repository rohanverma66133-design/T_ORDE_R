import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { createCategorySchema, updateCategorySchema, type CreateCategoryInput, type UpdateCategoryInput } from '@tord/validation';
import { Public, Roles } from '../../common/decorators/auth.decorators';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Roles(RoleCode.ADMIN, RoleCode.SUPER_ADMIN, RoleCode.VENDOR_ADMIN)
  @Post()
  create(@Body(new ZodValidationPipe(createCategorySchema)) dto: CreateCategoryInput) {
    return this.categoriesService.create(dto);
  }

  @Roles(RoleCode.ADMIN, RoleCode.SUPER_ADMIN, RoleCode.VENDOR_ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCategorySchema)) dto: UpdateCategoryInput,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Roles(RoleCode.ADMIN, RoleCode.SUPER_ADMIN)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}

