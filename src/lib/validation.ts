import { z } from "zod";

export const MESSAGING_PLATFORMS = ["sms", "whatsapp", "telegram"] as const;

export const LinkFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Link name is required")
    .max(120, "Link name must be 120 characters or fewer"),
  recipient_number: z
    .string()
    .trim()
    .min(1, "Recipient number is required")
    .regex(/^[+()0-9\s.-]+$/, "Recipient number contains invalid characters")
    .max(20, "Recipient number must be 20 characters or fewer"),
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(5000, "Message must be 5000 characters or fewer"),
  platform: z.enum(MESSAGING_PLATFORMS),
  status: z.enum(["active", "inactive"]),
});

export type LinkFormValues = z.infer<typeof LinkFormSchema>;

export type FormState =
  | {
      errors?: {
        name?: string[];
        recipient_number?: string[];
        message?: string[];
        platform?: string[];
        status?: string[];
      };
      message?: string;
    }
  | undefined;
