import { Controller, Get, Injectable, Module, type Type } from '@nestjs/common';
import { Public } from './decorators/auth.decorators';

export function createScaffoldModule(name: string): Type<unknown> {
  @Injectable()
  class ScaffoldService {
    status() {
      return { module: name, status: 'scaffolded' as const };
    }
  }

  @Controller(name)
  class ScaffoldController {
    constructor(private readonly service: ScaffoldService) {}

    @Public()
    @Get('status')
    status() {
      return this.service.status();
    }
  }

  @Module({
    controllers: [ScaffoldController],
    providers: [ScaffoldService],
    exports: [ScaffoldService],
  })
  class ScaffoldModule {}

  Object.defineProperty(ScaffoldModule, 'name', { value: `${toPascal(name)}Module` });
  return ScaffoldModule;
}

function toPascal(value: string): string {
  return value
    .split(/[-_/]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
