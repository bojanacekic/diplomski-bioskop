namespace AuthMicroservice.Domain;

public sealed class ChangeUserRoleRequestDto
{
    public UserRole Role { get; init; }
}
