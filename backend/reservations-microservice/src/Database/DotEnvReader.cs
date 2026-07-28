namespace Reservations.Database;

public static class DotEnvReader
{
    public static void Load(string path)
    {
        if (!File.Exists(path))
            return;

        foreach (var line in File.ReadLines(path))
        {
            var separatorIndex = line.IndexOf('=');
            if (separatorIndex <= 0 || line.TrimStart().StartsWith('#'))
                continue;

            var key = line[..separatorIndex].Trim();
            var value = line[(separatorIndex + 1)..].Trim();
            Environment.SetEnvironmentVariable(key, value);
        }
    }
}
