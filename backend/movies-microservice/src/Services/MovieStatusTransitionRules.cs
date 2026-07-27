using Movies.Domain;

namespace Movies.Services;

public static class MovieStatusTransitionRules
{
    public static bool CanTransition(MovieStatus from, MovieStatus to) =>
        from switch
        {
            MovieStatus.Upcoming => to is MovieStatus.Active or MovieStatus.Withdrawn,
            MovieStatus.Active => to is MovieStatus.Upcoming or MovieStatus.Withdrawn,
            MovieStatus.Withdrawn => false,
            _ => false,
        };
}
