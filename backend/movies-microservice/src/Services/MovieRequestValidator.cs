using Movies.Domain;

namespace Movies.Services;

public sealed class MovieRequestValidator : IMovieRequestValidator
{
    public Dictionary<string, string[]> Validate(CreateMovieRequestDto request) => Validate(
        request.Title, request.Description, request.Genre, request.DurationMinutes, request.PremiereDate, request.AgeRating, request.Status);

    public Dictionary<string, string[]> Validate(UpdateMovieRequestDto request) => Validate(
        request.Title, request.Description, request.Genre, request.DurationMinutes, request.PremiereDate, request.AgeRating, null);

    private static Dictionary<string, string[]> Validate(
        string title,
        string description,
        string genre,
        int durationMinutes,
        DateOnly premiereDate,
        string ageRating,
        MovieStatus? status)
    {
        var errors = new Dictionary<string, string[]>();

        AddIfInvalid(errors, "title", string.IsNullOrWhiteSpace(title) || title.Trim().Length > 200, "Title is required and can contain up to 200 characters.");
        AddIfInvalid(errors, "description", string.IsNullOrWhiteSpace(description) || description.Trim().Length > 2000, "Description is required and can contain up to 2000 characters.");
        AddIfInvalid(errors, "genre", string.IsNullOrWhiteSpace(genre) || genre.Trim().Length > 100, "Genre is required and can contain up to 100 characters.");
        AddIfInvalid(errors, "durationMinutes", durationMinutes is < 1 or > 600, "Duration must be between 1 and 600 minutes.");
        AddIfInvalid(errors, "premiereDate", premiereDate == default, "Premiere date is required.");
        AddIfInvalid(errors, "ageRating", string.IsNullOrWhiteSpace(ageRating) || ageRating.Trim().Length > 30, "Age rating is required and can contain up to 30 characters.");
        AddIfInvalid(errors, "status", status.HasValue && !Enum.IsDefined(status.Value), "A valid movie status is required.");

        return errors;
    }

    private static void AddIfInvalid(Dictionary<string, string[]> errors, string property, bool invalid, string message)
    {
        if (invalid) errors[property] = [message];
    }
}
