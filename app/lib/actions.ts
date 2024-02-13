'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({ invalid_type_error: 'Please select a customer' }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater that $0' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an ainvoice status',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  message?: string | null;
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
};

export const createInvoice = async (prevState: State, formdata: FormData) => {
  // const { customerId, amount, status } = CreateInvoice.parse({
  //   customerId: formdata.get('customerId'),
  //   amount: formdata.get('amount'),
  //   status: formdata.get('status'),
  // });

  const validatedFields = CreateInvoice.safeParse({
    customerId: formdata.get('customerId'),
    amount: formdata.get('amount'),
    status: formdata.get('status'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Missing fields: Failed to create invoice',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { customerId, amount, status } = validatedFields.data;

  // for handling multiple input data
  // const rawFormData = Object.fromEntries(formData.entries())

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
       INSERT into invoices (customer_id, amount,status,date)
       VALUES (${customerId},${amountInCents}, ${status}, ${date})
`;
  } catch (error) {
    return {
      message: 'Database Error: failed to create Invoice',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
};

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// ...

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  // const { customerId, amount, status } = UpdateInvoice.parse({
  //   customerId: formData.get('customerId'),
  //   amount: formData.get('amount'),
  //   status: formData.get('status'),
  // });

  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Missing fields: Failed to update invoice',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { customerId, amount, status } = validatedFields.data;

  const amountInCents = amount * 100;

  try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to update invoice',
    };
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  // throw new Error('failed to delete invoice');
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (error) {
    return {
      message: 'Database Eroor: Failed to delete invoice',
    };
  }
  revalidatePath('/dashboard/invoices');
}

export const authenticate = async (
  prevState: string | undefined,
  formData: FormData,
) => {
  try {
    await signIn('credentials', formData);
    // await signIn('github');
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid Credentials';
        default:
          return 'Something went wrong';
      }
    }
    throw error;
  }
};

export const githubLogin = async () => {
  console.log('github server action');
  try {
    await signIn('github');
    console.log('calling server action');
  } catch (error) {
    // return 'Can not Login Using Github';
    throw error;
  }
};
