using AuthMicroservice.Domain;
using FluentValidation;

namespace AuthMicroservice.WebAPI.Validators;

public sealed class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequestDto>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(request => request.CurrentPassword).NotEmpty();
        RuleFor(request => request.NewPassword).NotEmpty();
    }
}
