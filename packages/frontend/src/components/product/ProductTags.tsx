type ProductTagsProps = {
  tags: string[];
};

const ProductTags = ({ tags }: ProductTagsProps) => {
  return (
    <div className="px-4 mt-3">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[#F3F3F7] px-2.5 py-1 text-[12px] font-medium leading-tight text-[#29292B]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ProductTags;
