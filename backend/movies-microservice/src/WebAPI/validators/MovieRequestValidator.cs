using Movies.Domain;

namespace Movies.WebAPI.Validators;

public sealed class MovieRequestValidator : IMovieRequestValidator
{
    public Dictionary<string, string[]> Validate(CreateMovieRequestDto request) =>
        Validate(
            request.Title,
            request.Description,
            request.Genre,
            request.DurationMinutes,
            request.PremiereDate,
            request.AgeRating,
            request.TrailerUrl,
            request.Status
        );

    public Dictionary<string, string[]> Validate(UpdateMovieRequestDto request) =>
        Validate(
            request.Title,
            request.Description,
            request.Genre,
            request.DurationMinutes,
            request.PremiereDate,
            request.AgeRating,
            request.TrailerUrl,
            null
        );

    private static Dictionary<string, string[]> Validate(
        string title,
        string description,
        string genre,
        int durationMinutes,
        DateOnly premiereDate,
        string ageRating,
        string? trailerUrl,
        MovieStatus? status
    )
    {
        var errors = new Dictionary<string, string[]>();

        AddIfInvalid(
            errors,
            "title",
            string.IsNullOrWhiteSpace(title) || title.Trim().Length > 200,
            "Title is required and can contain up to 200 characters."
        );
        AddIfInvalid(
            errors,
            "description",
            string.IsNullOrWhiteSpace(description) || description.Trim().Length > 2000,
            "Description is required and can contain up to 2000 characters."
        );
        AddIfInvalid(
            errors,
            "genre",
            string.IsNullOrWhiteSpace(genre) || genre.Trim().Length > 100,
            "Genre is required and can contain up to 100 characters."
        );
        AddIfInvalid(
            errors,
            "durationMinutes",
            durationMinutes is < 1 or > 600,
            "Duration must be between 1 and 600 minutes."
        );
        AddIfInvalid(errors, "premiereDate", premiereDate == default, "Premiere date is required.");
        AddIfInvalid(
            errors,
            "ageRating",
            string.IsNullOrWhiteSpace(ageRating) || ageRating.Trim().Length > 30,
            "Age rating is required and can contain up to 30 characters."
        );
        AddIfInvalid(
            errors,
            "trailerUrl",
            !IsValidYouTubeUrl(trailerUrl),
            "Trailer URL must be a valid YouTube link and can contain up to 500 characters."
        );
        AddIfInvalid(
            errors,
            "status",
            status.HasValue && !Enum.IsDefined(status.Value),
            "A valid movie status is required."
        );

        return errors;
    }

    private static bool IsValidYouTubeUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return true;
        if (value.Trim().Length > 500 || !Uri.TryCreate(value.Trim(), UriKind.Absolute, out var uri))
            return false;
        var host = uri.Host.ToLowerInvariant();
        return host is "youtu.be" or "www.youtu.be" or "youtube.com" or "www.youtube.com" or "youtube-nocookie.com" or "www.youtube-nocookie.com";
    }

    private static void AddIfInvalid(
        Dictionary<string, string[]> errors,
        string property,
        bool invalid,
        string message
    )
    {
        if (invalid)
            errors[property] = [message];
    }
}
