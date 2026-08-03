import { Link } from "react-router-dom";
import { asset } from "../lib/asset";
import type { WorkItem } from "../data/works";

/** 포트폴리오 카드 — 취합 이미지(300x200) 사용 */
export default function WorkCard({ work }: { work: WorkItem }) {
  return (
    <Link to={`/work/${work.id}`} className="work-card work-card--ripple">
      <div className="work-card__thumb">
        <img
          src={asset(work.thumb)}
          alt={`${work.client} 캠페인`}
          loading="lazy"
          width={300}
          height={200}
        />
      </div>
      <div className="work-card__meta">
        <span>{work.category}</span>
        <strong>{work.client}</strong>
      </div>
    </Link>
  );
}
