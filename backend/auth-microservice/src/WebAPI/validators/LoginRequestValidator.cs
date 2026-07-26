using AuthMicroservice.Domain;
using FluentValidation;

namespace AuthMicroservice.WebAPI.Validators;

public sealed class LoginRequestValidator : AbstractValidator<LoginRequestDto>
{
    public LoginRequestValidator()
    {
        RuleFor(request => request.UsernameOrEmail).NotEmpty().MaximumLength(256);
        RuleFor(request => request.Password).NotEmpty().MaximumLength(100);
    }
}
