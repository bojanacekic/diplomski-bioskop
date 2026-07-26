using AuthMicroservice.Domain;

namespace AuthMicroservice.Services;

public interface IJwtTokenGenerator
{
    AuthResponseDto Generate(User user);
}
