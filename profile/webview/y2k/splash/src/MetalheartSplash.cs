/* METALHEART // Y2K - the program you start: splash + foobar2000 under one taskbar identity.
   Metalheart.exe [args]     starts foobar2000 (args passed on) and covers its window with the animated logo
                             (black, chrome sheen + lens flare) until the theme's panels say they have loaded.
                             If foobar2000 is already running it just hands the args over, no splash.
   Metalheart.exe --ready    sent by the theme (common.js, Y2K.bootHold): fades the splash away.
   Metalheart.exe --tag      sent by the deck each time foobar2000 starts (however it was started): gives foobar2000's
                             window the Metalheart taskbar identity (see AppId).
   Metalheart.exe --install  makes the Desktop and Start menu shortcuts and registers with Windows, as a first install would.
   Metalheart.exe --register / --unregister   adds/removes Metalheart in Settings > Default apps for audio + playlist
                             types (per user, see Assoc). Double-clicked files arrive as Metalheart.exe "file".
   TASKBAR: Windows groups taskbar buttons by AppUserModelID. The shortcuts carry the ID "Metalheart.Y2K" and so does
   foobar2000's main window (set from outside through its window property store, with a relaunch command pointing back
   here), so a pinned Metalheart shortcut and the running player are ONE button, and pinning the running player pins
   this launcher, not foobar2000.exe.
   Build: build.cmd (the C# compiler that comes with Windows' .NET Framework 4.x). */
using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;
using System.Windows.Threading;

static class Program
{
    public const string ReadyEvent = "Local\\MetalheartY2KSplashReady";

    [STAThread]
    static int Main(string[] args)
    {
        string dir = AppDomain.CurrentDomain.BaseDirectory;
        if (args.Length > 0 && args[0] == "--tag") { AppId.TagWhenReady(MyExe(), 15000); return 0; }
        bool quiet = args.Length > 1 && args[1] == "--quiet";
        if (args.Length > 0 && args[0] == "--install") { bool ok = AppId.Install(MyExe(), FindFoobar(dir), quiet); return Assoc.Register(MyExe(), quiet) && ok ? 0 : 1; }
        if (args.Length > 0 && args[0] == "--register") return Assoc.Register(MyExe(), quiet) ? 0 : 1;
        if (args.Length > 0 && args[0] == "--unregister") { Assoc.Unregister(MyExe()); return 0; }
        if (args.Length > 0 && args[0] == "--ready")
        {
            EventWaitHandle ev;
            if (EventWaitHandle.TryOpenExisting(ReadyEvent, out ev)) { ev.Set(); ev.Dispose(); }
            return 0;
        }

        string exe = FindFoobar(dir);
        var fwd = new StringBuilder();
        foreach (string a in args) fwd.Append(fwd.Length > 0 ? " " : "").Append(a.IndexOf(' ') >= 0 ? "\"" + a + "\"" : a);
        if (exe == null)
        {
            MessageBox.Show("METALHEART // Y2K can't find foobar2000.exe.\n\nRun \"Install Metalheart Y2K.cmd\" again, or keep Metalheart.exe inside the theme folder (profile\\webview\\y2k\\splash).", "Metalheart Y2K");
            return 1;
        }

        bool created;
        var ready = new EventWaitHandle(false, EventResetMode.ManualReset, ReadyEvent, out created);
        if (!created || Process.GetProcessesByName("foobar2000").Length > 0)
        {
            // already up (or another Metalheart is splashing, e.g. several files opened at once from Explorer): no
            // splash. If that splash hasn't started foobar2000 yet, wait for it so these files go to that instance
            // instead of a second foobar2000 popping up in front of the splash.
            var sw = Stopwatch.StartNew();
            while (Process.GetProcessesByName("foobar2000").Length == 0 && sw.ElapsedMilliseconds < 10000) Thread.Sleep(100);
            Launch(exe, fwd.ToString());
            return 0;
        }

        string marker = System.IO.Path.Combine(dir, "active.txt");
        long now = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds;
        try { File.WriteAllText(marker, now.ToString()); } catch { }
        try
        {
            var app = new Application { ShutdownMode = ShutdownMode.OnMainWindowClose };
            var w = new SplashWindow(dir, exe, fwd.ToString(), ready);
            app.Run(w);
        }
        finally { try { File.Delete(marker); } catch { } }
        return 0;
    }

    public static string MyExe() { return Process.GetCurrentProcess().MainModule.FileName; }

    public static Process Launch(string exe, string args)
    {
        try
        {
            return Process.Start(new ProcessStartInfo(exe, args) { UseShellExecute = true, WorkingDirectory = System.IO.Path.GetDirectoryName(exe) });
        }
        catch { return null; }
    }

    // portable install: <foobar2000>\profile\webview\y2k\splash ; otherwise the path the theme saved, or Program Files
    public static string FindFoobar(string dir)
    {
        var tries = new System.Collections.Generic.List<string>();
        try { tries.Add(System.IO.Path.GetFullPath(System.IO.Path.Combine(dir, @"..\..\..\..\foobar2000.exe"))); } catch { }
        try
        {
            string saved = File.ReadAllText(System.IO.Path.Combine(dir, @"..\fb2k-exe.txt")).Trim().Replace('/', '\\');
            if (saved.Length > 0) tries.Add(saved.EndsWith(".exe", StringComparison.OrdinalIgnoreCase) ? saved : System.IO.Path.Combine(saved, "foobar2000.exe"));
        }
        catch { }
        tries.Add(@"C:\Program Files\foobar2000\foobar2000.exe");
        tries.Add(@"C:\Program Files (x86)\foobar2000\foobar2000.exe");
        foreach (string t in tries) if (File.Exists(t)) return t;
        return null;
    }
}

class SplashWindow : Window
{
    // ---- timing (seconds)
    const double FadeIn = 0.35, LogoIn = 1.0, Cycle = 2.9, Sweep = 1.75, FadeOut = 0.7, MinShow = 1.6, MaxWait = 30;

    readonly string dir, exe, args;
    readonly EventWaitHandle ready;
    readonly Stopwatch clock = Stopwatch.StartNew();
    Process fb;
    IntPtr me, fbWnd;
    double outAt = -1; // clock time the fade-out started
    bool launched, tagged; int frames;

    readonly Grid stage = new Grid();
    readonly ScaleTransform stageScale = new ScaleTransform(1, 1);
    readonly Canvas fx = new Canvas { IsHitTestVisible = false };
    readonly Image logo = new Image(), refl = new Image();
    readonly Rectangle sheen = new Rectangle(), sheen2 = new Rectangle();
    readonly TranslateTransform sheenMove = new TranslateTransform(), sheen2Move = new TranslateTransform();
    readonly TextBlock loading = new TextBlock();
    readonly Rectangle bar = new Rectangle(), barGlint = new Rectangle();
    BitmapImage bmp;

    // lens flare parts
    readonly Ellipse glow = new Ellipse(), core = new Ellipse(), halo = new Ellipse(), streak = new Ellipse(), streak2 = new Ellipse();
    readonly Canvas rays = new Canvas();
    readonly RotateTransform raysTurn = new RotateTransform();
    readonly Shape[] ghosts = new Shape[7];
    readonly double[] ghostAt = { -0.35, 0.28, 0.55, 0.78, 1.15, 1.45, 1.9 };   // position along source -> centre -> beyond
    readonly double[] ghostSize = { 0.05, 0.11, 0.035, 0.17, 0.07, 0.24, 0.12 }; // x logo width
    readonly double[] ghostAlpha = { 0.35, 0.22, 0.5, 0.14, 0.3, 0.1, 0.18 };

    public SplashWindow(string dir, string exe, string args, EventWaitHandle ready)
    {
        this.dir = dir; this.exe = exe; this.args = args; this.ready = ready;
        Title = "Metalheart Y2K";
        WindowStyle = WindowStyle.None; AllowsTransparency = true; ResizeMode = ResizeMode.NoResize;
        Background = Brushes.Black; ShowInTaskbar = false; Topmost = true; ShowActivated = false; Opacity = 0;
        Cursor = Cursors.AppStarting;
        var wa = SystemParameters.WorkArea;
        // until foobar2000's window shows up: where it was last time (PlaceFromLast), or the whole work area
        Width = wa.Width; Height = wa.Height; Left = wa.Left; Top = wa.Top;

        try
        {
            bmp = new BitmapImage();
            bmp.BeginInit(); bmp.CacheOption = BitmapCacheOption.OnLoad; bmp.UriSource = new Uri(System.IO.Path.Combine(dir, "logo.png")); bmp.EndInit(); bmp.Freeze();
        }
        catch { bmp = null; }
        Build();

        SourceInitialized += (s, e) => { me = new WindowInteropHelper(this).Handle; PlaceFromLast(); };
        SizeChanged += (s, e) => Layout();
        MouseLeftButtonDown += (s, e) => Dismiss();
        KeyDown += (s, e) => { if (e.Key == Key.Escape) Dismiss(); };
        CompositionTarget.Rendering += Frame;
        var track = new DispatcherTimer(DispatcherPriority.Send) { Interval = TimeSpan.FromMilliseconds(30) };
        track.Tick += (s, e) => Track();
        track.Start();
    }

    // ------------------------------------------------------------------ scene
    void Build()
    {
        var root = new Grid { ClipToBounds = true };
        Content = root;

        stage.HorizontalAlignment = HorizontalAlignment.Center;
        stage.RenderTransform = stageScale;
        stage.Opacity = 0;
        root.Children.Add(stage);
        root.Children.Add(fx);

        logo.Source = bmp; logo.Stretch = Stretch.Uniform;
        RenderOptions.SetBitmapScalingMode(logo, BitmapScalingMode.HighQuality);
        stage.Children.Add(logo);

        // chrome sheen: a bright diagonal band (and a fainter blue echo) that only exists where the logo does
        var mask = new ImageBrush(bmp) { Stretch = Stretch.Uniform };
        sheen.Fill = Band(new[] { 0.0, 0.40, 0.47, 0.5, 0.53, 0.60, 1.0 }, new byte[] { 0, 0, 150, 255, 150, 0, 0 }, Color.FromRgb(255, 255, 255), sheenMove);
        sheen.OpacityMask = mask;
        sheen2.Fill = Band(new[] { 0.0, 0.43, 0.5, 0.57, 1.0 }, new byte[] { 0, 0, 120, 0, 0 }, Color.FromRgb(170, 215, 255), sheen2Move);
        sheen2.OpacityMask = mask;
        stage.Children.Add(sheen2);
        stage.Children.Add(sheen);

        // the floor reflection the year 2000 demanded
        refl.Source = bmp; refl.Stretch = Stretch.Uniform; refl.Opacity = 0.22;
        refl.RenderTransformOrigin = new Point(0.5, 0.5); refl.RenderTransform = new ScaleTransform(1, -1);
        var fade = new LinearGradientBrush { StartPoint = new Point(0, 0), EndPoint = new Point(0, 1) };
        fade.GradientStops.Add(new GradientStop(Color.FromArgb(0, 0, 0, 0), 0)); fade.GradientStops.Add(new GradientStop(Color.FromArgb(0, 0, 0, 0), 0.62));
        fade.GradientStops.Add(new GradientStop(Color.FromArgb(255, 0, 0, 0), 1));
        refl.OpacityMask = fade; // flipped with the image, so the top of the reflection (nearest the logo) is strongest
        stage.Children.Add(refl);

        loading.Text = "L O A D I N G"; loading.Foreground = new SolidColorBrush(Color.FromRgb(150, 164, 180));
        loading.HorizontalAlignment = HorizontalAlignment.Center; loading.VerticalAlignment = VerticalAlignment.Top;
        try { loading.FontFamily = new FontFamily(new Uri(System.IO.Path.GetFullPath(System.IO.Path.Combine(dir, @"..\fonts\")) ), "./#Orbitron"); } catch { }
        stage.Children.Add(loading);
        bar.Fill = new SolidColorBrush(Color.FromRgb(40, 46, 54)); bar.Height = 1; bar.VerticalAlignment = VerticalAlignment.Top;
        barGlint.Height = 1; barGlint.VerticalAlignment = VerticalAlignment.Top; barGlint.HorizontalAlignment = HorizontalAlignment.Left;
        var gl = new LinearGradientBrush { StartPoint = new Point(0, 0), EndPoint = new Point(1, 0) };
        gl.GradientStops.Add(new GradientStop(Color.FromArgb(0, 200, 230, 255), 0)); gl.GradientStops.Add(new GradientStop(Color.FromArgb(255, 235, 245, 255), 0.5));
        gl.GradientStops.Add(new GradientStop(Color.FromArgb(0, 200, 230, 255), 1));
        barGlint.Fill = gl;
        stage.Children.Add(bar); stage.Children.Add(barGlint);

        // ---- lens flare (drawn on the full-window layer so its ghosts can wander across the screen)
        glow.Fill = Radial(new[] { 0.0, 0.18, 0.45, 1.0 }, new[] { Color.FromArgb(200, 255, 255, 255), Color.FromArgb(110, 190, 225, 255), Color.FromArgb(30, 90, 150, 255), Color.FromArgb(0, 40, 80, 200) });
        core.Fill = Radial(new[] { 0.0, 0.35, 1.0 }, new[] { Color.FromArgb(255, 255, 255, 255), Color.FromArgb(220, 240, 248, 255), Color.FromArgb(0, 200, 230, 255) });
        halo.Fill = Radial(new[] { 0.0, 0.78, 0.83, 0.87, 0.9, 0.93, 0.96, 1.0 }, new[] {
            Color.FromArgb(0, 255, 255, 255), Color.FromArgb(0, 255, 120, 80), Color.FromArgb(70, 255, 96, 60), Color.FromArgb(70, 255, 210, 60),
            Color.FromArgb(70, 70, 255, 140), Color.FromArgb(70, 60, 160, 255), Color.FromArgb(60, 160, 80, 255), Color.FromArgb(0, 160, 80, 255) });
        streak.Fill = Radial(new[] { 0.0, 0.25, 1.0 }, new[] { Color.FromArgb(230, 230, 245, 255), Color.FromArgb(90, 120, 180, 255), Color.FromArgb(0, 60, 120, 255) });
        streak2.Fill = Radial(new[] { 0.0, 1.0 }, new[] { Color.FromArgb(160, 200, 230, 255), Color.FromArgb(0, 120, 180, 255) });
        for (int i = 0; i < 8; i++) // star rays: thin tapered spikes, alternating long and short
        {
            var spike = new Polygon { Points = new PointCollection { new Point(0, -1), new Point(1, 0), new Point(0, 1), new Point(-1, 0) } };
            spike.Fill = Radial(new[] { 0.0, 1.0 }, new[] { Color.FromArgb(220, 255, 255, 255), Color.FromArgb(0, 180, 220, 255) });
            spike.Stretch = Stretch.Fill;
            spike.Tag = i;
            spike.RenderTransformOrigin = new Point(0.5, 0.5);
            spike.RenderTransform = new RotateTransform(i * 22.5);
            rays.Children.Add(spike);
        }
        rays.RenderTransform = raysTurn;
        Color[] gc = { Color.FromRgb(120, 255, 200), Color.FromRgb(90, 170, 255), Color.FromRgb(255, 200, 90), Color.FromRgb(170, 120, 255),
                       Color.FromRgb(140, 255, 120), Color.FromRgb(80, 200, 255), Color.FromRgb(255, 120, 200) };
        for (int i = 0; i < ghosts.Length; i++)
        {
            Shape g = i % 2 == 0 ? (Shape)Hexagon() : new Ellipse();
            var c = gc[i];
            g.Fill = Radial(new[] { 0.0, 0.7, 1.0 }, new[] { Color.FromArgb(40, c.R, c.G, c.B), Color.FromArgb(90, c.R, c.G, c.B), Color.FromArgb(20, c.R, c.G, c.B) });
            g.Stroke = new SolidColorBrush(Color.FromArgb(70, c.R, c.G, c.B)); g.StrokeThickness = 1;
            ghosts[i] = g;
            fx.Children.Add(g);
        }
        fx.Children.Add(halo); fx.Children.Add(glow); fx.Children.Add(streak2); fx.Children.Add(streak); fx.Children.Add(rays); fx.Children.Add(core);
    }

    static Polygon Hexagon()
    {
        var p = new Polygon { Stretch = Stretch.Fill };
        for (int k = 0; k < 6; k++) { double a = Math.PI / 3 * k + Math.PI / 6; p.Points.Add(new Point(Math.Cos(a), Math.Sin(a))); }
        return p;
    }
    static RadialGradientBrush Radial(double[] at, Color[] c)
    {
        var b = new RadialGradientBrush();
        for (int i = 0; i < at.Length; i++) b.GradientStops.Add(new GradientStop(c[i], at[i]));
        return b;
    }
    static LinearGradientBrush Band(double[] at, byte[] alpha, Color c, TranslateTransform move)
    {
        var b = new LinearGradientBrush { StartPoint = new Point(0, 0), EndPoint = new Point(1, 0.6), RelativeTransform = move };
        for (int i = 0; i < at.Length; i++) b.GradientStops.Add(new GradientStop(Color.FromArgb(alpha[i], c.R, c.G, c.B), at[i]));
        return b;
    }

    double lw, lh; // logo size (DIPs)
    void Layout()
    {
        double aspect = bmp != null ? bmp.PixelWidth / (double)bmp.PixelHeight : 1.8;
        lw = Math.Max(120, Math.Min(Math.Min(ActualWidth * 0.38, ActualHeight * 0.38 * aspect), 860));
        lh = lw / aspect;
        foreach (FrameworkElement el in new FrameworkElement[] { logo, sheen, sheen2 })
        {
            el.Width = lw; el.Height = lh; el.VerticalAlignment = VerticalAlignment.Top; el.Margin = new Thickness(0);
        }
        refl.Width = lw; refl.Height = lh; refl.VerticalAlignment = VerticalAlignment.Top; refl.Margin = new Thickness(0, lh * 1.04, 0, 0);
        double fs = Math.Max(9, Math.Min(15, lw * 0.018));
        loading.FontSize = fs; loading.Margin = new Thickness(0, lh * 1.42, 0, 0);
        bar.Width = lw * 0.5; bar.Margin = new Thickness(0, lh * 1.42 + fs * 2.1, 0, 0);
        barGlint.Width = lw * 0.12; barGlint.Margin = new Thickness(lw * 0.25, lh * 1.42 + fs * 2.1, 0, 0);
        // tall enough to hold the reflection (a smaller stage would clip it), placed so logo + LOADING sit centred
        stage.Width = lw; stage.Height = lh * 2.05; stage.VerticalAlignment = VerticalAlignment.Top;
        stage.Margin = new Thickness(0, Math.Max(0, (ActualHeight - lh * 1.6) / 2), 0, 0);
        stage.RenderTransformOrigin = new Point(0.5, 0.5 * lh / stage.Height); // zoom about the logo's centre
    }

    // ------------------------------------------------------------------ animation, every frame
    static double Smooth(double x) { x = Math.Max(0, Math.Min(1, x)); return x * x * (3 - 2 * x); }
    static void Put(FrameworkElement el, double cx, double cy, double w, double h)
    {
        el.Width = Math.Max(0.1, w); el.Height = Math.Max(0.1, h);
        Canvas.SetLeft(el, cx - w / 2); Canvas.SetTop(el, cy - h / 2);
    }

    void Frame(object sender, EventArgs e)
    {
        if (frames == 0) clock.Restart(); // the show starts with the first frame actually drawn, not at start-up
        double t = clock.Elapsed.TotalSeconds;
        if (lw <= 0) Layout();
        frames++;
        // foobar2000 starts only once the splash is fully opaque and on screen (a few frames drawn), so its window
        // can never show through the fade-in; from then on the splash re-snaps onto that window every frame
        if (!launched && t >= FadeIn + 0.1 && frames > 3) { launched = true; fb = Program.Launch(exe, args); }
        if (launched && outAt < 0) Track();

        // in: the black comes up quickly, the logo eases in after it and settles from a slight zoom
        double win = Smooth(t / FadeIn), lin = Smooth((t - 0.15) / LogoIn);
        double outK = outAt < 0 ? 0 : Smooth((t - outAt) / FadeOut);
        Opacity = win * (1 - outK);
        stage.Opacity = lin;
        double sc = 0.94 + 0.06 * (1 - Math.Pow(1 - lin, 3)) + 0.05 * outK;
        stageScale.ScaleX = stageScale.ScaleY = sc;
        if (outAt >= 0 && t - outAt >= FadeOut) { CompositionTarget.Rendering -= Frame; Close(); return; }

        // the loop: a sheen sweeps the chrome left to right, a flare rides it and blooms crossing the sphere
        double ct = (t + 0.4) % Cycle, p = -0.3 + 1.6 * Smooth(ct / Sweep);   // p = across the logo, 0..1
        // gradient (0,0)->(1,0.6): the band centre sits where x - o + 0.6y = 0.68 (see Band); keep it on the flare
        double fy = 0.52 - 0.364 * p;
        double o = p + 0.6 * fy - 0.68;
        sheenMove.X = o; sheen2Move.X = o - 0.16;
        double inLoop = ct < Sweep ? Smooth(ct / 0.25) * Smooth((Sweep - ct) / 0.3) : 0;
        sheen.Opacity = inLoop; sheen2.Opacity = inLoop * 0.8;

        double cx = ActualWidth / 2, cy = ActualHeight / 2;
        Point lp = stage.TranslatePoint(new Point(0, 0), fx);
        double sx = lp.X + p * lw * sc, sy = lp.Y + fy * lh * sc; // flare source on screen
        double bloom = Math.Exp(-Math.Pow((p - 0.33) / 0.11, 2));   // over the sphere's highlight
        double inten = lin * (1 - outK) * inLoop * (0.35 + 0.65 * bloom);
        fx.Opacity = 1;
        double L = lw * sc;

        Put(glow, sx, sy, L * (0.32 + 0.25 * bloom), L * (0.32 + 0.25 * bloom)); glow.Opacity = inten;
        Put(core, sx, sy, L * 0.05, L * 0.05); core.Opacity = Math.Min(1, inten * 1.4);
        Put(halo, sx, sy, L * 0.42, L * 0.42); halo.Opacity = inten * (0.3 + 0.7 * bloom);
        Put(streak, sx, sy, L * (0.9 + 0.9 * bloom), L * 0.018); streak.Opacity = inten;
        Put(streak2, sx, sy, L * 1.9, L * 0.006); streak2.Opacity = inten * bloom;
        Canvas.SetLeft(rays, sx); Canvas.SetTop(rays, sy);
        raysTurn.Angle = t * 14;
        foreach (Polygon spike in rays.Children)
        {
            int i = (int)spike.Tag;
            double len = L * (i % 2 == 0 ? 0.26 : 0.13) * (0.6 + 0.6 * bloom), wid = L * 0.007;
            spike.Width = len * 2; spike.Height = wid * 2;
            Canvas.SetLeft(spike, -len); Canvas.SetTop(spike, -wid);
        }
        rays.Opacity = inten;
        // ghosts sit on the line from the source through the middle of the window, as a real lens throws them
        for (int i = 0; i < ghosts.Length; i++)
        {
            double k = ghostAt[i], gx = sx + (cx - sx) * k, gy = sy + (cy - sy) * k, d = L * ghostSize[i];
            Put(ghosts[i], gx, gy, d, d);
            ghosts[i].Opacity = inten * ghostAlpha[i] * 2.2;
        }

        // LOADING breathes; a glint runs along the line under it
        loading.Opacity = 0.45 + 0.35 * (0.5 + 0.5 * Math.Sin(t * 3.2));
        double gp = (t * 0.55) % 1;
        barGlint.Margin = new Thickness(lw * 0.25 + (lw * 0.5 - lw * 0.12) * gp, bar.Margin.Top, 0, 0);
    }

    // ------------------------------------------------------------------ foobar2000's window + the ready signal
    void Track()
    {
        double t = clock.Elapsed.TotalSeconds;
        if (outAt < 0)
        {
            bool signalled = ready.WaitOne(0);
            bool gone = fb != null && SafeExited(fb);
            if ((signalled && t >= MinShow) || t > MaxWait || gone || (launched && fb == null)) Dismiss();
        }
        if (fb == null || SafeExited(fb)) return;
        IntPtr w = FindMain(fb.Id);
        if (w == IntPtr.Zero) return;
        fbWnd = w;
        if (!tagged) { tagged = true; AppId.Tag(w, Program.MyExe()); } // one taskbar button with the Metalheart pin
        if (IsIconic(w)) return;
        RECT r;
        if (DwmGetWindowAttribute(w, 9 /* extended frame bounds */, out r, Marshal.SizeOf(typeof(RECT))) != 0 && !GetWindowRect(w, out r)) return;
        // stay always-on-top while foobar2000 (or the splash) is in front: foobar2000 activating its new window would
        // otherwise come up over the splash. If the user switches to another program meanwhile, stop floating over it.
        bool front = true;
        IntPtr fg = GetForegroundWindow();
        if (fg != IntPtr.Zero && fg != me)
        {
            uint fgPid; GetWindowThreadProcessId(fg, out fgPid);
            front = fgPid == (uint)fb.Id || fgPid == (uint)Process.GetCurrentProcess().Id || IsShellWindow(fg);
        }
        if (Topmost != front) Topmost = front;
        SetWindowPos(me, IntPtr.Zero, r.L, r.T, r.R - r.L, r.B - r.T, 0x0010 /* NOACTIVATE */ | 0x0004 /* NOZORDER */);
        lastRect = r;
    }
    RECT lastRect;

    static bool SafeExited(Process p) { try { return p.HasExited; } catch { return false; } }

    void Dismiss()
    {
        if (outAt >= 0) return;
        outAt = clock.Elapsed.TotalSeconds;
        Cursor = null;
        if (lastRect.R > lastRect.L) try { File.WriteAllText(System.IO.Path.Combine(dir, "last-rect.txt"), lastRect.L + "," + lastRect.T + "," + (lastRect.R - lastRect.L) + "," + (lastRect.B - lastRect.T)); } catch { }
    }

    // before foobar2000's window exists, cover where it was last time
    void PlaceFromLast()
    {
        try
        {
            string[] v = File.ReadAllText(System.IO.Path.Combine(dir, "last-rect.txt")).Split(',');
            int x = int.Parse(v[0]), y = int.Parse(v[1]), w = int.Parse(v[2]), h = int.Parse(v[3]);
            if (w > 200 && h > 150) SetWindowPos(me, IntPtr.Zero, x, y, w, h, 0x0010 | 0x0004);
        }
        catch { }
    }

    static IntPtr FindMain(int pid)
    {
        IntPtr best = IntPtr.Zero; long area = 0;
        EnumWindows((h, l) =>
        {
            uint p; GetWindowThreadProcessId(h, out p);
            if (p != pid || !IsWindowVisible(h) || GetWindow(h, 4 /* GW_OWNER */) != IntPtr.Zero) return true;
            RECT r; GetWindowRect(h, out r);
            long a = (long)(r.R - r.L) * (r.B - r.T);
            if (a > area) { area = a; best = h; }
            return true;
        }, IntPtr.Zero);
        return area > 200 * 150 ? best : IntPtr.Zero;
    }

    [StructLayout(LayoutKind.Sequential)] struct RECT { public int L, T, R, B; }
    delegate bool EnumProc(IntPtr h, IntPtr l);
    [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc f, IntPtr l);
    [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
    [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
    [DllImport("user32.dll")] static extern IntPtr GetWindow(IntPtr h, uint cmd);
    [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
    [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int w, int hh, uint f);
    [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] static extern IntPtr GetShellWindow();
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
    // the desktop / taskbar taking focus (e.g. right after a double-click on the shortcut) isn't "another program"
    static bool IsShellWindow(IntPtr h)
    {
        if (h == GetShellWindow()) return true;
        var sb = new StringBuilder(64); GetClassName(h, sb, 64);
        string c = sb.ToString();
        return c == "Progman" || c == "WorkerW" || c == "Shell_TrayWnd";
    }
    [DllImport("dwmapi.dll")] static extern int DwmGetWindowAttribute(IntPtr h, int a, out RECT r, int size);
}

/* The Metalheart taskbar identity: shortcuts and foobar2000's window share one AppUserModelID. */
static class AppId
{
    public const string Id = "Metalheart.Y2K", Name = "Metalheart";
    static readonly Guid AppUserModelProps = new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3");
    // PKEY_AppUserModel_*: RelaunchCommand 2, RelaunchIconResource 3, RelaunchDisplayNameResource 4, ID 5
    static PROPERTYKEY Key(uint pid) { return new PROPERTYKEY { fmtid = AppUserModelProps, pid = pid }; }

    /** foobar2000's main window joins the Metalheart taskbar button; pinning it pins this launcher. */
    public static bool Tag(IntPtr hwnd, string launcher)
    {
        IPropertyStore ps = null;
        try
        {
            Guid iid = typeof(IPropertyStore).GUID;
            if (SHGetPropertyStoreForWindow(hwnd, ref iid, out ps) != 0 || ps == null) return false;
            // relaunch details first, the ID last: setting the ID is what makes the taskbar regroup
            Set(ps, 2, "\"" + launcher + "\"");
            Set(ps, 3, launcher + ",0");
            Set(ps, 4, Name);
            Set(ps, 5, Id);
            ps.Commit();
            return true;
        }
        catch { return false; }
        finally { if (ps != null) Marshal.ReleaseComObject(ps); }
    }

    /** --tag: wait (up to ms) for foobar2000's main window, then tag it. */
    public static void TagWhenReady(string launcher, int ms)
    {
        var sw = Stopwatch.StartNew();
        while (sw.ElapsedMilliseconds < ms)
        {
            foreach (var p in Process.GetProcessesByName("foobar2000"))
            {
                IntPtr w = IntPtr.Zero;
                try { p.Refresh(); w = p.MainWindowHandle; } catch { }
                if (w != IntPtr.Zero && Tag(w, launcher)) return;
            }
            Thread.Sleep(250);
        }
    }

    /** --install: Desktop + Start menu shortcuts that start Metalheart with its icon and taskbar identity. */
    public static bool Install(string launcher, string foobar, bool quiet)
    {
        string work = foobar != null ? System.IO.Path.GetDirectoryName(foobar) : System.IO.Path.GetDirectoryName(launcher);
        bool ok = true;
        foreach (string folder in new[] {
            Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),
            Environment.GetFolderPath(Environment.SpecialFolder.Programs) })
        {
            try { MakeShortcut(System.IO.Path.Combine(folder, Name + ".lnk"), launcher, work); }
            catch (Exception e) { ok = false; if (!quiet) MessageBox.Show("Couldn't make the shortcut in " + folder + ":\n" + e.Message, "Metalheart"); }
        }
        return ok;
    }

    static void MakeShortcut(string lnk, string target, string work)
    {
        var link = (IShellLinkW)new CShellLink();
        try
        {
            link.SetPath(target);
            link.SetWorkingDirectory(work);
            link.SetIconLocation(target, 0);
            link.SetDescription("METALHEART // Y2K - foobar2000 with the Metalheart deck");
            var ps = (IPropertyStore)link;
            Set(ps, 5, Id);
            ps.Commit();
            ((System.Runtime.InteropServices.ComTypes.IPersistFile)link).Save(lnk, true);
        }
        finally { Marshal.ReleaseComObject(link); }
    }

    static void Set(IPropertyStore ps, uint pid, string value)
    {
        var k = Key(pid);
        var v = new PROPVARIANT { vt = 31 /* VT_LPWSTR */, p = Marshal.StringToCoTaskMemUni(value) };
        try { ps.SetValue(ref k, ref v); }
        finally { Marshal.FreeCoTaskMem(v.p); }
    }

    [StructLayout(LayoutKind.Sequential, Pack = 4)] struct PROPERTYKEY { public Guid fmtid; public uint pid; }
    [StructLayout(LayoutKind.Explicit)] struct PROPVARIANT
    {
        [FieldOffset(0)] public ushort vt;
        [FieldOffset(8)] public IntPtr p;
        [FieldOffset(16)] public IntPtr pad; // full PROPVARIANT size
    }
    [ComImport, Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IPropertyStore
    {
        [PreserveSig] int GetCount(out uint c);
        [PreserveSig] int GetAt(uint i, out PROPERTYKEY k);
        [PreserveSig] int GetValue(ref PROPERTYKEY k, out PROPVARIANT v);
        [PreserveSig] int SetValue(ref PROPERTYKEY k, ref PROPVARIANT v);
        [PreserveSig] int Commit();
    }
    [ComImport, Guid("000214F9-0000-0000-C000-000000000046"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IShellLinkW
    {
        void GetPath([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder f, int cch, IntPtr pfd, uint flags);
        void GetIDList(out IntPtr ppidl);
        void SetIDList(IntPtr pidl);
        void GetDescription([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder s, int cch);
        void SetDescription([MarshalAs(UnmanagedType.LPWStr)] string s);
        void GetWorkingDirectory([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder s, int cch);
        void SetWorkingDirectory([MarshalAs(UnmanagedType.LPWStr)] string s);
        void GetArguments([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder s, int cch);
        void SetArguments([MarshalAs(UnmanagedType.LPWStr)] string s);
        void GetHotkey(out short h);
        void SetHotkey(short h);
        void GetShowCmd(out int c);
        void SetShowCmd(int c);
        void GetIconLocation([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder s, int cch, out int i);
        void SetIconLocation([MarshalAs(UnmanagedType.LPWStr)] string s, int i);
        void SetRelativePath([MarshalAs(UnmanagedType.LPWStr)] string s, uint r);
        void Resolve(IntPtr hwnd, uint f);
        void SetPath([MarshalAs(UnmanagedType.LPWStr)] string s);
    }
    [ComImport, Guid("00021401-0000-0000-C000-000000000046")] class CShellLink { }
    [DllImport("shell32.dll")] static extern int SHGetPropertyStoreForWindow(IntPtr hwnd, ref Guid iid, [MarshalAs(UnmanagedType.Interface)] out IPropertyStore ps);
}

/* Metalheart in Windows' Default apps: registered per user (HKCU, no admin) as a music player that can open the audio and
   playlist types below. Windows never lets a program make itself the default; this only puts Metalheart in the list
   (Settings > Apps > Default apps > Metalheart, and every type's "Open with" choices) for the user to pick. */
static class Assoc
{
    const string ProgId = "Metalheart.Audio", PlaylistProgId = "Metalheart.Playlist", CapKey = @"Software\Metalheart\Capabilities";
    public static readonly string[] Audio = {
        ".mp3", ".mp2", ".mpc", ".flac", ".m4a", ".m4b", ".mp4", ".aac", ".ogg", ".oga", ".opus", ".spx", ".wav", ".wv",
        ".wma", ".ape", ".aif", ".aiff", ".aifc", ".tta", ".tak", ".dsf", ".dff", ".mka", ".ac3", ".dts", ".caf", ".w64", ".rf64" };
    public static readonly string[] Playlists = { ".m3u", ".m3u8", ".pls", ".cue", ".fpl", ".xspf", ".asx", ".wpl" };

    public static bool Register(string launcher, bool quiet)
    {
        try
        {
            string open = "\"" + launcher + "\" \"%1\"", icon = launcher + ",0";
            WriteProgId(ProgId, "Metalheart audio file", open, icon);
            WriteProgId(PlaylistProgId, "Metalheart playlist", open, icon);

            using (var app = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(@"Software\Classes\Applications\" + System.IO.Path.GetFileName(launcher)))
            {
                app.SetValue("FriendlyAppName", AppId.Name);
                app.SetValue("AppUserModelID", AppId.Id);
                using (var k = app.CreateSubKey(@"DefaultIcon")) k.SetValue("", icon);
                using (var k = app.CreateSubKey(@"shell\open\command")) k.SetValue("", open);
                using (var st = app.CreateSubKey("SupportedTypes"))
                    foreach (string e in All()) st.SetValue(e, "");
            }

            using (var cap = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(CapKey))
            {
                cap.SetValue("ApplicationName", AppId.Name);
                cap.SetValue("ApplicationDescription", "METALHEART // Y2K - foobar2000 with the Metalheart deck");
                cap.SetValue("ApplicationIcon", icon);
                using (var fa = cap.CreateSubKey("FileAssociations"))
                {
                    foreach (string e in Audio) fa.SetValue(e, ProgId);
                    foreach (string e in Playlists) fa.SetValue(e, PlaylistProgId);
                }
            }
            using (var ra = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(@"Software\RegisteredApplications"))
                ra.SetValue(AppId.Name, CapKey);

            // also offer it straight from each type's "Open with" list
            foreach (string e in Audio) OpenWith(e, ProgId, true);
            foreach (string e in Playlists) OpenWith(e, PlaylistProgId, true);
            Changed();
            return true;
        }
        catch (Exception x)
        {
            if (!quiet) MessageBox.Show("Couldn't register Metalheart with Windows:\n" + x.Message, "Metalheart");
            return false;
        }
    }

    public static void Unregister(string launcher)
    {
        var cu = Microsoft.Win32.Registry.CurrentUser;
        foreach (string e in Audio) OpenWith(e, ProgId, false);
        foreach (string e in Playlists) OpenWith(e, PlaylistProgId, false);
        try { using (var ra = cu.OpenSubKey(@"Software\RegisteredApplications", true)) if (ra != null) ra.DeleteValue(AppId.Name, false); } catch { }
        try { cu.DeleteSubKeyTree(@"Software\Metalheart", false); } catch { }
        try { cu.DeleteSubKeyTree(@"Software\Classes\" + ProgId, false); } catch { }
        try { cu.DeleteSubKeyTree(@"Software\Classes\" + PlaylistProgId, false); } catch { }
        try { cu.DeleteSubKeyTree(@"Software\Classes\Applications\" + System.IO.Path.GetFileName(launcher), false); } catch { }
        Changed();
    }

    static System.Collections.Generic.IEnumerable<string> All()
    {
        foreach (string e in Audio) yield return e;
        foreach (string e in Playlists) yield return e;
    }

    static void WriteProgId(string id, string name, string open, string icon)
    {
        using (var k = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(@"Software\Classes\" + id))
        {
            k.SetValue("", name);
            k.SetValue("FriendlyTypeName", name);
            k.SetValue("AppUserModelID", AppId.Id);
            using (var d = k.CreateSubKey("DefaultIcon")) d.SetValue("", icon);
            using (var s = k.CreateSubKey(@"shell\open")) s.SetValue("", "Play with Metalheart");
            using (var c = k.CreateSubKey(@"shell\open\command")) c.SetValue("", open);
        }
    }

    static void OpenWith(string ext, string progId, bool add)
    {
        try
        {
            using (var k = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(@"Software\Classes\" + ext + @"\OpenWithProgids"))
                if (add) k.SetValue(progId, new byte[0], Microsoft.Win32.RegistryValueKind.None);
                else k.DeleteValue(progId, false);
        }
        catch { }
    }

    [DllImport("shell32.dll")] static extern void SHChangeNotify(int id, uint flags, IntPtr a, IntPtr b);
    static void Changed() { SHChangeNotify(0x08000000 /* SHCNE_ASSOCCHANGED */, 0, IntPtr.Zero, IntPtr.Zero); }
}
