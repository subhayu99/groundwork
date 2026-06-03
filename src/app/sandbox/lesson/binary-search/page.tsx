"use client";

import { LessonRuntime } from "@/shared/lesson/LessonRuntime";
import { binarySearchLesson } from "@/categories/algorithms/topics/binary-search/lesson-spec";

export default function BinarySearchLessonSandbox() {
  return <LessonRuntime spec={binarySearchLesson} />;
}
