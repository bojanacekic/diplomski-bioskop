namespace Payments.Database;

public static class DotEnvReader
{
    public static void Load(string path)
    {
        if (!File.Exists(path))
            return;

        foreach (var line in File.ReadLines(path))
        {
            var value = line.Trim();
            if (string.IsNullOrEmpty(value) || value.StartsWith('#'))
                continue;

            var separator = value.IndexOf('=');
            if (separator <= 0)
                continue;

            var key = value[..separator].Trim();
            var setting = value[(separator + 1)..].Trim();
            if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
                Environment.SetEnvironmentVariable(key, setting);
        }
    }
}
