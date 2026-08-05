'use client';

import { type ReactNode } from 'react';
import { useForm, type UseFormProps, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

interface FormProps<T extends FieldValues>
  extends Omit<UseFormProps<T>, 'resolver'> {
  schema: z.ZodType<T>;
  onSubmit: (values: T) => void | Promise<void>;
  children: (methods: ReturnType<typeof useForm<T>>) => ReactNode;
}

/**
 * Generic form wrapper using React Hook Form + Zod validation.
 *
 * Implements the Template Method pattern: the form lifecycle
 * (validation, submission, error handling) is fixed, while the
 * actual fields are provided by the caller via the render prop.
 *
 * @example
 * const schema = z.object({ name: z.string().min(1, 'Nome obrigatório') });
 * <Form schema={schema} onSubmit={(v) => save(v)}>
 *   {({ register, formState: { errors } }) => (
 *     <TextField {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
 *   )}
 * </Form>
 */
export function Form<T extends FieldValues>({
  schema,
  onSubmit,
  children,
  ...formProps
}: FormProps<T>) {
  const methods = useForm<T>({
    resolver: zodResolver(schema as any) as any,
    ...formProps,
  });

  return (
    <form onSubmit={methods.handleSubmit(onSubmit)} noValidate aria-label="Formulário">
      {children(methods)}
    </form>
  );
}
