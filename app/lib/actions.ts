'use server';

import { z } from 'zod';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export const createInvoice = async (formdata: FormData) => {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formdata.get('customerId'),
    amount: formdata.get('amount'),
    status: formdata.get('status'),
  });

  // for handling multiple input data
  // const rawFormData = Object.fromEntries(formData.entries())

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  console.log(rawData);
};
