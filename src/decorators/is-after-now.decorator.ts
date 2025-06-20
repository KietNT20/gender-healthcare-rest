import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Lớp chứa logic xác thực chính.
 * Nó kiểm tra xem giá trị ngày tháng có lớn hơn thời gian hiện tại không.
 */
@ValidatorConstraint({ name: 'isAfterNow', async: false })
export class IsAfterNowConstraint implements ValidatorConstraintInterface {
    /**
     * Phương thức validate, được class-validator tự động gọi.
     * @param value - Giá trị của thuộc tính được trang trí (ví dụ: giá trị của `appointmentDate`).
     * @param args - Các đối số validation.
     * @returns `true` nếu hợp lệ, `false` nếu không hợp lệ.
     */
    validate(value: any, args: ValidationArguments) {
        // Chỉ thực hiện kiểm tra nếu giá trị là một đối tượng Date hợp lệ
        if (!(value instanceof Date)) {
            return false;
        }
        // So sánh thời gian của ngày được cung cấp với thời gian hiện tại
        return value.getTime() > new Date().getTime();
    }

    /**
     * Phương thức trả về thông báo lỗi mặc định khi validation thất bại.
     * @param args - Các đối số validation, có thể dùng để tùy chỉnh thông báo lỗi.
     * @returns Chuỗi thông báo lỗi.
     */
    defaultMessage(args: ValidationArguments) {
        return `"${args.property}" must be a date in the future.`;
    }
}

export function IsAfterNow(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsAfterNowConstraint,
        });
    };
}
