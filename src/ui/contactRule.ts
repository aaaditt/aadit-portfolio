/** The rules of the contact form, kept apart from the page so they can be tested. */

/** The longest note the form will send. */
export const MESSAGE_MAX = 2000;

export type Fields = {
  name: string;
  email: string;
  message: string;
  /** A field people never see and so leave empty. Bots fill it in. */
  website: string;
};

export type Errors = Partial<Record<"name" | "email" | "message", string>>;

/** Something before the @, something after it, and a dot in what follows. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** What is wrong with a note, field by field. Empty when it is ready to send. */
export function check(fields: Fields): Errors {
  const errors: Errors = {};
  if (!fields.name.trim()) errors.name = "Please add your name.";
  if (!EMAIL.test(fields.email.trim())) errors.email = "Please add an email I can reply to.";
  if (!fields.message.trim()) errors.message = "Please write a message.";
  else if (fields.message.length > MESSAGE_MAX) errors.message = `Please keep it under ${MESSAGE_MAX} characters.`;
  return errors;
}

export type Status = "idle" | "sending" | "sent" | "failed";
export type Event = "submit" | "ok" | "error" | "edit";

/** Where the form goes next. Pressing send while it is sending does nothing, so one press is one email. */
export function step(status: Status, event: Event): Status {
  if (status === "sending") {
    if (event === "ok") return "sent";
    if (event === "error") return "failed";
    return "sending";
  }
  if (event === "submit") return "sending";
  if (event === "edit") return "idle";
  // An answer that arrives when nothing is being sent is ignored.
  return status;
}

export type Keys = { service: string; template: string; publicKey: string };

/** The EmailJS keys if all three are set, otherwise null: without them there is no form. */
export function keysFrom(env: Partial<Record<keyof Keys, string | undefined>>): Keys | null {
  const { service, template, publicKey } = env;
  return service && template && publicKey ? { service, template, publicKey } : null;
}

/** True when the hidden field was filled in. The form then pretends to send and sends nothing. */
export const isBot = (fields: Fields) => fields.website !== "";
