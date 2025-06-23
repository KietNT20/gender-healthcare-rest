# Email Verification và Password Reset Flow

## Cách thức hoạt động

### 1. Email Verification Flow

#### Backend (NestJS):

- Khi user đăng ký, email verification sẽ được gửi với link: `{APP_URL}/auth/verify-email?token={token}`
- Endpoint `GET /auth/verify-email` sẽ:
    - Xác thực token
    - Nếu thành công: redirect đến `{FRONTEND_URL}/auth/verify-success?message=Email verified successfully`
    - Nếu thất bại: redirect đến `{FRONTEND_URL}/auth/verify-error?message={error_message}`

#### Frontend:

Cần tạo 2 trang:

- `/auth/verify-success`: Hiển thị thông báo xác thực thành công
- `/auth/verify-error`: Hiển thị thông báo lỗi xác thực

### 2. Password Reset Flow

#### Backend (NestJS):

- Khi user yêu cầu reset password, email sẽ được gửi với link: `{APP_URL}/auth/reset-password?token={token}`
- Endpoint `GET /auth/reset-password` sẽ:
    - Validate token (không reset password)
    - Nếu token hợp lệ: redirect đến `{FRONTEND_URL}/auth/reset-password?token={token}`
    - Nếu token không hợp lệ: redirect đến `{FRONTEND_URL}/auth/reset-error?message={error_message}`

#### Frontend:

Cần tạo 2 trang:

- `/auth/reset-password?token={token}`: Form để nhập password mới, gửi PUT request đến `/auth/reset-password/{token}`
- `/auth/reset-error`: Hiển thị thông báo lỗi token

## Environment Variables cần thiết

```env
# Backend URL (để gửi trong email)
APP_URL=http://localhost:3000

# Frontend URL (để redirect sau xử lý)
FRONTEND_URL=http://localhost:4200
```

## API Endpoints

### Email Verification

- `GET /auth/verify-email?token={token}` - Xác thực email và redirect đến frontend
- `POST /auth/resend-verification` - Gửi lại email xác thực

### Password Reset

- `POST /auth/forgot-password` - Gửi email reset password
- `GET /auth/reset-password?token={token}` - Validate token và redirect đến frontend
- `PUT /auth/reset-password/{token}` - Reset password thực tế

## Ví dụ Frontend Routes (Angular/React/Vue)

```typescript
// Angular Routes
const routes: Routes = [
    {
        path: 'auth/verify-success',
        component: EmailVerifySuccessComponent,
    },
    {
        path: 'auth/verify-error',
        component: EmailVerifyErrorComponent,
    },
    {
        path: 'auth/reset-password',
        component: ResetPasswordComponent,
    },
    {
        path: 'auth/reset-error',
        component: ResetPasswordErrorComponent,
    },
];
```

## Lưu ý

1. **Token Security**: Tất cả token đều có thời gian hết hạn
2. **HTTPS**: Trong production nên sử dụng HTTPS cho tất cả URLs
3. **CORS**: Đảm bảo frontend domain được config trong CORS settings
4. **Error Handling**: Frontend cần handle các trường hợp redirect với query parameters
