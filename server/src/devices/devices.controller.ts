import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Device } from '@prisma/client';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { DeviceResponseDto } from './dto/device-response.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

/** Endpoint REST untuk manajemen device. Hanya menerima request dan mendelegasikan ke service. */
@ApiTags('devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar semua device' })
  @ApiOkResponse({ type: [DeviceResponseDto] })
  findAll(): Promise<Device[]> {
    return this.devicesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail satu device' })
  @ApiOkResponse({ type: DeviceResponseDto })
  @ApiNotFoundResponse({ description: 'Device tidak ditemukan' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Device> {
    return this.devicesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Buat device baru' })
  @ApiCreatedResponse({ type: DeviceResponseDto })
  create(@Body() dto: CreateDeviceDto): Promise<Device> {
    return this.devicesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ubah nama atau lokasi device' })
  @ApiOkResponse({ type: DeviceResponseDto })
  @ApiNotFoundResponse({ description: 'Device tidak ditemukan' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeviceDto,
  ): Promise<Device> {
    return this.devicesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hapus device' })
  @ApiNoContentResponse({ description: 'Device terhapus' })
  @ApiNotFoundResponse({ description: 'Device tidak ditemukan' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.devicesService.remove(id);
  }
}