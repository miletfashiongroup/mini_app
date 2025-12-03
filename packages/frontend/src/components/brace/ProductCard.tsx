// packages/frontend/src/components/brace/ProductCard.tsx
import clsx from "clsx";
import React from "react";

import newIcon from "@/assets/images/icon-new.svg";
import type { Product } from "@/entities/product/model/types";

import { Badge } from "./Badge";
import { Button } from "./Button";

type ProductCardProps = {
  product?: Product;
  isNew?: boolean;
  className?: string;
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, isNew = false, className }) => {
  const name = product?.name ?? "CRUSADER T800X";
  const description =
    product?.description ?? "Next generation defense system robot with AI-enhanced targeting and auto-recovery mode.";
  const imageSrc = product?.hero_media_url;
  const badgeText = isNew ? "LATEST MODEL" : "FEATURED";

  return (
    <div className={clsx("flex flex-col md:flex-row bg-white p-4 rounded-card shadow-md gap-4", className)}>
      <div className="flex-shrink-0 w-full md:w-1/3 bg-bg-muted rounded-card flex items-center justify-center overflow-hidden">
        {imageSrc ? (
          <img src={imageSrc} alt={name} className="h-48 w-full object-contain" loading="lazy" />
        ) : (
          <div className="h-48 w-full flex items-center justify-center text-text-muted">
            <span className="text-sm font-semibold tracking-wide">Robot Preview</span>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between w-full">
        <div>
          {isNew ? <img src={newIcon} alt="Новинка" className="h-5 w-auto" /> : <Badge text={badgeText} color="bg-green-600" />}
          <h2 className="text-h2 font-bold text-text-base mt-2">{name}</h2>
          <p className="text-text-muted text-sm mt-1">{description}</p>
        </div>
        <div className="mt-4 flex gap-2">
          <Button>See Specs</Button>
          <Button variant="outline">Customize</Button>
        </div>
      </div>
    </div>
  );
};
