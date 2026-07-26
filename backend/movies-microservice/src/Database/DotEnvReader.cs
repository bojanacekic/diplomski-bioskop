namespace Movies.Database;

public static class DotEnvReader
{
    public static void Load()
    {
        var directory = new DirectoryInfo(Directory.GetCurrentDirectory());

        while (directory is not null)
        {
            var envFile = Path.Combine(directory.FullName, ".env");
            if (File.Exists(envFile))
            {
                foreach (var line in File.ReadLines(envFile))
                {
                    var separator = line.IndexOf('=');
                    if (separator <= 0 || line.TrimStart().StartsWith('#')) continue;
                    var key = line[..separator].Trim();
                    var value = line[(separator + 1)..].Trim().Trim('"');
                    if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
                        Environment.SetEnvironmentVariable(key, value);
                }
                return;
            }

            directory = directory.Parent;
        }
    }
}
