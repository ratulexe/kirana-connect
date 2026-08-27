/**
 * Parkinsans (the body font), never a paragraph or control. The literal
 * `text-ink` class stays on the text span (not just semantically applied)
 * because AdminLayout.jsx overrides it to white on the dark sidebar via a
 * `[&_.text-ink]:text-white` descendant selector -- removing the class name
 * would silently break that.
 *
 * The entrance moment lives in the app-level loading screen (see
 * AppLoader.jsx / App.jsx), not here.
 */
export default function Logo() {
  return (
    <span className="inline-block font-sans text-[1.25rem] font-extrabold tracking-tight text-ink sm:text-[1.5rem]">
      Kirana{" "}
      <span className="bg-gradient-to-r from-[#7c3aed] via-[#e93483] to-[#ffd45e] bg-clip-text text-transparent">
        Connect
      </span>{" "}
      <span className="text-primary">Admin</span>
    </span>
  );
}
