"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { sfx } from "@/audio/engine";
import { contactHref, contactsReady } from "@/content/about";
import { MESSAGE_MAX, check, isBot, keysFrom, step, type Errors, type Fields, type Status } from "./contactRule";
import styles from "./Contact.module.css";

// Read one by one and in full, so the build can put the values into the page.
const KEYS = keysFrom({
  service: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
  template: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
});

const EMPTY: Fields = { name: "", email: "", message: "", website: "" };

/**
 * How to reach him: the direct links, always, and a note to send if the email service is set up.
 * A note that fails to send is never lost: it stays in the box, with the address beside it.
 */
export function Contact() {
  const ready = contactsReady();
  const email = ready.find((c) => c.id === "email");
  const [fields, setFields] = useState(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [sentTo, setSentTo] = useState("");
  const [copied, setCopied] = useState(false);
  /** The status as of right now, for the press that lands before the page has redrawn. */
  const live = useRef<Status>("idle");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => void (mounted.current = false);
  }, []);

  const move = (event: Parameters<typeof step>[1]) => {
    live.current = step(live.current, event);
    setStatus(live.current);
  };

  const edit = (field: keyof Fields, value: string) => {
    setFields((was) => ({ ...was, [field]: value }));
    if (errors[field as keyof Errors]) setErrors((was) => ({ ...was, [field]: undefined }));
    move("edit");
  };

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!KEYS || live.current === "sending") return;
    const found = check(fields);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    move("submit");
    try {
      if (!isBot(fields)) {
        const emailjs = (await import("@emailjs/browser")).default;
        await emailjs.send(
          KEYS.service,
          KEYS.template,
          { from_name: fields.name.trim(), reply_to: fields.email.trim(), message: fields.message.trim() },
          { publicKey: KEYS.publicKey },
        );
      }
      if (!mounted.current) return;
      setSentTo(fields.name.trim());
      setFields({ ...EMPTY, name: fields.name, email: fields.email });
      move("ok");
      sfx.chime();
    } catch {
      // Everything typed stays where it is, so nothing has to be written twice.
      if (mounted.current) move("error");
    }
  }

  async function copy() {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email.value);
      setCopied(true);
      window.setTimeout(() => mounted.current && setCopied(false), 2000);
    } catch {
      // No clipboard here: open a new message instead.
      window.location.assign(contactHref(email));
    }
  }

  const sending = status === "sending";

  return (
    <section className={styles.contact} aria-label="Contact">
      <h2 className={styles.heading}>Say hello</h2>

      {ready.length === 0 && !KEYS && <p className={styles.quiet}>Contact details are on their way.</p>}

      {ready.length > 0 && (
        <ul className={styles.links}>
          {ready.map((c) => (
            <li key={c.id}>
              {c.id === "email" ? (
                <button type="button" className={styles.link} onClick={copy}>
                  <span aria-live="polite">{copied ? "Copied" : "Copy email"}</span>
                </button>
              ) : (
                <a href={contactHref(c)} className={styles.link} target="_blank" rel="noreferrer">
                  {c.label} <span aria-hidden="true">▶</span>
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      {KEYS && (
        <form className={styles.form} onSubmit={send} noValidate>
          <label className={styles.field}>
            <span>Your name</span>
            <input
              type="text"
              name="name"
              autoComplete="name"
              value={fields.name}
              onChange={(event) => edit("name", event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "contact-name-error" : undefined}
            />
            {errors.name && (
              <em id="contact-name-error" className={styles.error}>
                {errors.name}
              </em>
            )}
          </label>
          <label className={styles.field}>
            <span>Your email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={fields.email}
              onChange={(event) => edit("email", event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "contact-email-error" : undefined}
            />
            {errors.email && (
              <em id="contact-email-error" className={styles.error}>
                {errors.email}
              </em>
            )}
          </label>
          <label className={styles.field}>
            <span>Message</span>
            <textarea
              name="message"
              maxLength={MESSAGE_MAX}
              value={fields.message}
              onChange={(event) => edit("message", event.target.value)}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? "contact-message-error" : undefined}
            />
            {errors.message && (
              <em id="contact-message-error" className={styles.error}>
                {errors.message}
              </em>
            )}
          </label>
          <label className={styles.trap} aria-hidden="true">
            Leave this empty
            <input type="text" name="website" tabIndex={-1} autoComplete="off" value={fields.website} onChange={(event) => edit("website", event.target.value)} />
          </label>
          <div>
            <button type="submit" className={styles.link} disabled={sending}>
              {sending ? "Sending" : "Send"} <span aria-hidden="true">▶</span>
            </button>
          </div>
          <p className={styles.result} role="status">
            {status === "sent" && `Sent. Thanks, ${sentTo}!`}
            {status === "failed" && (
              <>
                That did not send. Your message is still here, so you can try again
                {email ? (
                  <>
                    , or write to <a href={contactHref(email)}>{email.value}</a>
                  </>
                ) : null}
                .
              </>
            )}
          </p>
        </form>
      )}
    </section>
  );
}
