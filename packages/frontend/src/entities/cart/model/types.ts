import type { components } from '@brace/shared-api';

export type CartItem = components['schemas']['CartItemRead'];
export type CartCollection = components['schemas']['CartCollection'];
export type CartItemPayload = components['schemas']['CartItemCreate'];
export type CartItemUpdatePayload = {
  quantity: number;
};
