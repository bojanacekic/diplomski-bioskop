using Movies.Domain;

namespace Movies.WebAPI.Validators;

public interface IMovieRequestValidator
{
    Dictionary<string, string[]> Validate(CreateMovieRequestDto request);
    Dictionary<string, string[]> Validate(UpdateMovieRequestDto request);
}
