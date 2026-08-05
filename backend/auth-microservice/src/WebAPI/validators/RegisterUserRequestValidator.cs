using AuthMicroservice.Domain;
using FluentValidation;

namespace AuthMicroservice.WebAPI.Validators;

public sealed class RegisterUserRequestValidator : AbstractValidator<RegisterUserRequestDto>
{
    public RegisterUserRequestValidator()
    {
        RuleFor(request => request.Username)
            .NotEmpty()
            .MinimumLength(3)
            .MaximumLength(50)
            .Matches("^[A-Za-z0-9_.-]+$");
        RuleFor(request => request.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(request => request.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(request => request.LastName).NotEmpty().MaximumLength(100);
        RuleFor(request => request.Password)
            .NotEmpty()
            .MinimumLength(6).WithMessage("Password must be at least 6 characters.");
    }
}
