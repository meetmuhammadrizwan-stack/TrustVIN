export type PackageTier =
  | 'basic'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'ruby'
  | 'sapphire'
  | 'window_sticker'
  | 'salvage_info'
  | 'service_records';

export interface PricingCalculation {
  packageName: string;
  packageTier: PackageTier;
  packageOriginalPrice: number;

  // Window Sticker breakdown
  windowStickerIncluded: boolean;
  windowStickerOriginalPrice: number;
  windowStickerDiscountPercentage: number;
  windowStickerDiscountAmount: number;
  windowStickerFinalPrice: number;

  // Salvage Information breakdown
  salvageInformationIncluded: boolean;
  salvageInformationOriginalPrice: number;
  salvageInformationDiscountAmount: number;
  salvageInformationFinalPrice: number;

  // Promotional metadata
  appliedOfferName: string;
  totalDiscount: number;
  finalAmountPaid: number;
}

export const BASE_PRICES: Record<string, number> = {
  basic: 44.95,
  gold: 89.95,
  platinum: 99.95,
  diamond: 129.95,
  ruby: 239.95,
  sapphire: 499.95,
  window_sticker: 29.99,
  salvage_info: 149.00,
  service_records: 399.99,
};

export const PACKAGE_NAMES: Record<string, string> = {
  basic: 'Basic Vehicle History Report',
  gold: 'Gold Vehicle History Report',
  platinum: 'Platinum Vehicle History Report',
  diamond: 'Diamond Vehicle History Report',
  ruby: 'Ruby Vehicle History Report',
  sapphire: 'Sapphire Vehicle History Report',
  window_sticker: 'Official Vehicle Window Sticker',
  salvage_info: 'Salvage & Total Loss Information Report',
  service_records: 'Vehicle Service & Maintenance Records',
};

export const WINDOW_STICKER_ORIGINAL_PRICE = 29.99;
export const SALVAGE_INFO_ORIGINAL_PRICE = 149.00;

export function normalizePackageTier(input: string | undefined | null): PackageTier {
  if (!input) return 'basic';
  const lower = input.toLowerCase().trim();
  if (lower.includes('service') || lower.includes('maintenance')) return 'service_records';
  if (lower.includes('salvage')) return 'salvage_info';
  if (lower === 'window sticker' || lower === 'window_sticker' || lower === 'sticker') return 'window_sticker';
  if (lower.includes('sapphire') || lower.includes('saphire')) return 'sapphire';
  if (lower.includes('ruby')) return 'ruby';
  if (lower.includes('diamond')) return 'diamond';
  if (lower.includes('platinum')) return 'platinum';
  if (lower.includes('gold')) return 'gold';
  return 'basic';
}

/**
 * Calculates complete pricing breakdown for an order according to the promotional rules:
 * - Basic ($44.95): Window Sticker optional ($29.99). 25% discount ONLY on Window Sticker ($22.49, $7.50 off). Total $67.44.
 * - Gold ($89.95): Window Sticker optional ($29.99). 50% discount ONLY on Window Sticker ($14.99, $15.00 off). Total $104.94.
 * - Platinum ($99.95): Window Sticker FREE ($0.00 final, $29.99 off). Included in purchase. Total $99.95.
 * - Diamond ($129.95): Window Sticker FREE ($0.00 final, $29.99 off) + Salvage Info FREE ($0.00 final, $149.00 off). Total $129.95.
 */
export function calculateOrderPricing(
  packageInput: string,
  includeWindowSticker: boolean = false
): PricingCalculation {
  const tier = normalizePackageTier(packageInput);
  const packageOriginalPrice = BASE_PRICES[tier] || 44.95;
  const packageName = PACKAGE_NAMES[tier] || 'Basic Vehicle History Report';

  let windowStickerIncluded = false;
  let windowStickerOriginalPrice = 0;
  let windowStickerDiscountPercentage = 0;
  let windowStickerDiscountAmount = 0;
  let windowStickerFinalPrice = 0;

  let salvageInformationIncluded = false;
  let salvageInformationOriginalPrice = 0;
  let salvageInformationDiscountAmount = 0;
  let salvageInformationFinalPrice = 0;

  let appliedOfferName = 'Standard Package';

  switch (tier) {
    case 'basic': {
      if (includeWindowSticker) {
        windowStickerIncluded = true;
        windowStickerOriginalPrice = WINDOW_STICKER_ORIGINAL_PRICE;
        windowStickerDiscountPercentage = 25;
        // 25% discount on $29.99: $7.50 discount, final $22.49
        windowStickerDiscountAmount = 7.50;
        windowStickerFinalPrice = 22.49;
        appliedOfferName = 'Basic Report + 25% OFF Window Sticker';
      }
      break;
    }

    case 'gold': {
      if (includeWindowSticker) {
        windowStickerIncluded = true;
        windowStickerOriginalPrice = WINDOW_STICKER_ORIGINAL_PRICE;
        windowStickerDiscountPercentage = 50;
        // 50% discount on $29.99: $15.00 discount, final $14.99
        windowStickerDiscountAmount = 15.00;
        windowStickerFinalPrice = 14.99;
        appliedOfferName = 'Gold Package + 50% OFF Window Sticker';
      }
      break;
    }

    case 'platinum': {
      // Platinum includes Window Sticker FREE ($0.00 final)
      windowStickerIncluded = true;
      windowStickerOriginalPrice = WINDOW_STICKER_ORIGINAL_PRICE;
      windowStickerDiscountPercentage = 100;
      windowStickerDiscountAmount = WINDOW_STICKER_ORIGINAL_PRICE;
      windowStickerFinalPrice = 0.00;
      appliedOfferName = 'Platinum Package + FREE Window Sticker';
      break;
    }

    case 'diamond': {
      // Diamond includes Window Sticker FREE ($0.00 final) AND Salvage Information FREE ($0.00 final)
      windowStickerIncluded = true;
      windowStickerOriginalPrice = WINDOW_STICKER_ORIGINAL_PRICE;
      windowStickerDiscountPercentage = 100;
      windowStickerDiscountAmount = WINDOW_STICKER_ORIGINAL_PRICE;
      windowStickerFinalPrice = 0.00;

      salvageInformationIncluded = true;
      salvageInformationOriginalPrice = SALVAGE_INFO_ORIGINAL_PRICE;
      salvageInformationDiscountAmount = SALVAGE_INFO_ORIGINAL_PRICE;
      salvageInformationFinalPrice = 0.00;

      appliedOfferName = 'Diamond Package + FREE Window Sticker & FREE Salvage Information';
      break;
    }

    case 'window_sticker': {
      windowStickerIncluded = true;
      windowStickerOriginalPrice = WINDOW_STICKER_ORIGINAL_PRICE;
      windowStickerDiscountPercentage = 0;
      windowStickerDiscountAmount = 0;
      windowStickerFinalPrice = WINDOW_STICKER_ORIGINAL_PRICE;
      appliedOfferName = 'Official Vehicle Window Sticker';
      break;
    }

    case 'salvage_info': {
      salvageInformationIncluded = true;
      salvageInformationOriginalPrice = SALVAGE_INFO_ORIGINAL_PRICE;
      salvageInformationDiscountAmount = 0;
      salvageInformationFinalPrice = SALVAGE_INFO_ORIGINAL_PRICE;
      appliedOfferName = 'Salvage & Total Loss Information Report';
      break;
    }

    default: {
      // Other packages (Ruby, Sapphire, etc.)
      if (includeWindowSticker) {
        windowStickerIncluded = true;
        windowStickerOriginalPrice = WINDOW_STICKER_ORIGINAL_PRICE;
        windowStickerDiscountPercentage = 0;
        windowStickerDiscountAmount = 0;
        windowStickerFinalPrice = WINDOW_STICKER_ORIGINAL_PRICE;
      }
      break;
    }
  }

  const totalDiscount = Number(
    (windowStickerDiscountAmount + salvageInformationDiscountAmount).toFixed(2)
  );

  const finalAmountPaid = Number(
    (
      (tier === 'window_sticker' ? 0 : packageOriginalPrice) +
      windowStickerFinalPrice +
      (tier === 'salvage_info' ? 0 : salvageInformationFinalPrice)
    ).toFixed(2)
  );

  return {
    packageName,
    packageTier: tier,
    packageOriginalPrice,
    windowStickerIncluded,
    windowStickerOriginalPrice,
    windowStickerDiscountPercentage,
    windowStickerDiscountAmount,
    windowStickerFinalPrice,
    salvageInformationIncluded,
    salvageInformationOriginalPrice,
    salvageInformationDiscountAmount,
    salvageInformationFinalPrice,
    appliedOfferName,
    totalDiscount,
    finalAmountPaid,
  };
}
