using Movies.Domain;

namespace Movies.Services;

public interface IMovieRequestValidator
{
    Dictionary<string, string[]> Validate(CreateMovieRequestDto request);
    Dictionary<string, string[]> Validate(UpdateMovieRequestDto request);
}
