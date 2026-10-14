import { z } from 'zod';

export const MAX_QUANTITY_KG = 50000;
export const MAX_PRICE_PER_KG = 1000000;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const listingFormSchema = z
  .object({
    cropId: z.string().min(1, 'Please select a crop category'),
    title: z.string().min(2, 'Title must be at least 2 characters').max(100, 'Title cannot exceed 100 characters'),
    varietyName: z.string().max(100, 'Variety name cannot exceed 100 characters').optional().or(z.literal('')),
    varietyType: z.enum(['heirloom', 'hybrid', 'opv', 'organic', 'desi'], {
      errorMap: () => ({ message: 'Please select a variety type' }),
    }),
    seedCondition: z.enum(['raw', 'cleaned', 'treated', 'graded', 'sun_dried'], {
      errorMap: () => ({ message: 'Please select seed condition' }),
    }),
    listingType: z.enum(['sale', 'exchange', 'both'], {
      errorMap: () => ({ message: 'Please select a transaction type' }),
    }),
    quantityKg: z
      .number({ invalid_type_error: 'Quantity must be a valid number' })
      .positive('Quantity must be greater than 0 kg')
      .max(MAX_QUANTITY_KG, `Maximum allowable seed batch is ${MAX_QUANTITY_KG.toLocaleString()} kg`),
    pricePerKg: z
      .number({ invalid_type_error: 'Price must be a valid number' })
      .nonnegative('Price cannot be negative')
      .max(MAX_PRICE_PER_KG, `Price cannot exceed PKR ${MAX_PRICE_PER_KG.toLocaleString()}/kg`)
      .nullable()
      .optional(),
    exchangeRequirements: z
      .string()
      .max(500, 'Exchange requirements cannot exceed 500 characters')
      .nullable()
      .optional()
      .or(z.literal('')),
    germinationRate: z
      .number({ invalid_type_error: 'Germination rate must be a valid percentage' })
      .min(0, 'Germination rate cannot be negative')
      .max(100, 'Germination rate cannot exceed 100%')
      .nullable()
      .optional(),
    harvestYear: z
      .number({ invalid_type_error: 'Harvest year must be a valid year' })
      .int()
      .min(2000, 'Harvest year cannot be older than 2000')
      .max(2100, 'Harvest year must be valid'),
    province: z.enum(
      [
        'punjab',
        'sindh',
        'khyberPakhtunkhwa',
        'balochistan',
        'gilgitBaltistan',
        'azadKashmir',
        'islamabad',
      ],
      { errorMap: () => ({ message: 'Please select a province' }) }
    ),
    district: z.string().min(2, 'District is required'),
    tehsil: z.string().optional().or(z.literal('')),
    villageOrArea: z.string().optional().or(z.literal('')),
    description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().or(z.literal('')),
    claimedCertified: z.boolean().default(false),
    certificationDetails: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    // Rule: Sale and Both listings require a positive cash price
    if ((data.listingType === 'sale' || data.listingType === 'both') && (!data.pricePerKg || data.pricePerKg <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A defined price per kg greater than 0 is required for sale listings.',
        path: ['pricePerKg'],
      });
    }

    // Rule: Both listings must define exchange requirements
    if (data.listingType === 'both' && (!data.exchangeRequirements || data.exchangeRequirements.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please specify the seeds or terms accepted for exchange.',
        path: ['exchangeRequirements'],
      });
    }
  });

export type ListingFormData = z.infer<typeof listingFormSchema>;
