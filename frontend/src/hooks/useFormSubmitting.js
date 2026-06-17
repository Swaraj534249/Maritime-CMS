import { useEffect, useState } from "react";

const listeners = new Map();

function notify(formId, submitting) {
  listeners.get(formId)?.forEach((fn) => fn(submitting));
}

/** Called by DynamicFormBuilder for the full async submit lifecycle (incl. file uploads). */
export function setFormSubmitting(formId, submitting) {
  if (!formId) return;
  notify(formId, submitting);
}

/** Subscribe to submit-in-progress state for external dialog action buttons. */
export function useFormSubmitting(formId) {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!formId) return undefined;

    const handler = (value) => setSubmitting(value);
    const set = listeners.get(formId) ?? new Set();
    set.add(handler);
    listeners.set(formId, set);

    return () => {
      set.delete(handler);
      if (set.size === 0) listeners.delete(formId);
    };
  }, [formId]);

  return submitting;
}
