using AuthMicroservice.Domain;
using FluentValidation;

namespace AuthMicroservice.WebAPI.Validators;

public sealed class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequestDto>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(request => request.Token).NotEmpty().Length(64);
        RuleFor(request => request.NewPassword)
            .NotEmpty()
            .MinimumLength(6).WithMessage("Password must be at least 6 characters.")
            .MaximumLength(100);
    }
}
