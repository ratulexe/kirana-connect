/**
 * Birthstone carries the brand name only ("Kirana Connect Admin"), never a
 * paragraph or control. The literal `text-ink` class stays on the text span
 * (not just semantically applied) because AdminLayout.jsx overrides it to
 * white on the dark sidebar via a `[&_.text-ink]:text-white` descendant
 * selector -- removing the class name would silently break that.
 */
export default function Logo() {
  return (
    <span className="font-brand text-[1.75rem] leading-none font-normal text-ink sm:text-[2rem]">
      Kirana Connect <span className="text-primary">Admin</span>
    </span>
  );
}
