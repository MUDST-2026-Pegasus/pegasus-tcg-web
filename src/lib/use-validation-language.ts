import { useEffect, useRef } from "react";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import { useLanguage } from "./language";

/** Revalidate visible errors after switching language without touching pristine fields. */
export function useValidationLanguage<T extends FieldValues>(form: UseFormReturn<T>) {
  const { language } = useLanguage();
  const previous = useRef(language);
  const { errors } = form.formState;
  useEffect(() => {
    if (previous.current === language) return;
    previous.current = language;
    const fields = Object.keys(errors) as FieldPath<T>[];
    if (fields.length > 0) void form.trigger(fields);
  }, [language, errors, form]);
}
