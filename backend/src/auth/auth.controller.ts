import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReqContext, RequestContext } from '../common/decorators/request-context.decorator';
import { AuthUser } from '../common/types/auth-user.interface';

// Credential endpoints get a much tighter rate limit than the global default.
// The limit is read per request so it can be tuned via AUTH_THROTTLE_LIMIT (default 10 per minute per client).
const AUTH_THROTTLE = { default: { limit: () => parseInt(process.env.AUTH_THROTTLE_LIMIT ?? '', 10) || 10, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({ status: 200, description: 'Signed in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto, @ReqContext() ctx: RequestContext) {
    return this.authService.login(dto, ctx);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('signup')
  @ApiOperation({ summary: 'Create a new organization and its first administrator' })
  @ApiResponse({ status: 201, description: 'Organization created' })
  @ApiResponse({ status: 403, description: 'Self-service sign-up is disabled' })
  @ApiResponse({ status: 409, description: 'Organization slug already taken' })
  signup(@Body() dto: SignupDto, @ReqContext() ctx: RequestContext) {
    return this.authService.signup(dto, ctx);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate a refresh token for a new access token' })
  @ApiResponse({ status: 401, description: 'Invalid, expired or reused refresh token' })
  refresh(@Body() dto: RefreshTokenDto, @ReqContext() ctx: RequestContext) {
    return this.authService.refresh(dto.refreshToken, ctx);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a refresh token (ends the session)' })
  logout(@Body() dto: RefreshTokenDto, @ReqContext() ctx: RequestContext) {
    return this.authService.logout(dto.refreshToken, ctx);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current authenticated user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Start Google sign-in (only when configured)' })
  googleLogin() {
    // Redirect is performed by Passport.
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: { user: unknown }) {
    return req.user;
  }

  @Public()
  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Start Microsoft sign-in (only when configured)' })
  microsoftLogin() {
    // Redirect is performed by Passport.
  }

  @Public()
  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  microsoftCallback(@Req() req: { user: unknown }) {
    return req.user;
  }
}
