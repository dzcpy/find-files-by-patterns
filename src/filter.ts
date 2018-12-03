/**
 * A filter is a test function which determines whether or not a given element
 * should be kept.
 */
export type Filter<T> = (element: T) => Promise<boolean>;

/**
 * A filter is a test function which determines whether or not a given element
 * should be kept.
 */
export type FilterSync<T> = (element: T) => boolean;

/**
 * A filter compounder is a test function which combines a sequence of filters.
 */
export type FilterCompounder = <T>(
  filters: Array<Filter<T> | FilterSync<T>>,
) => Filter<T>;

/**
 * A filter compounder is a test function which combines a sequence of filters.
 */
export type FilterCompounderSync = <T>(
  filters: Array<FilterSync<T>>,
) => FilterSync<T>;

/**
 * A conjunction is a filter which combines a given array of filters using
 * logical conjunction. This means that any element that passes the combined
 * test has passed all of the filters.
 * @param filters The filters to combine in conjunction.
 * @returns The logical conjunction of the given tests.
 */
export const conjunction: FilterCompounder = <T>(
  filters: Array<Filter<T> | FilterSync<T>>,
): Filter<T> => async (element: T): Promise<boolean> => {
  for (const filter of filters) {
    if (!(await filter(element))) {
      return false;
    }
  }
  return true;
};

/**
 * A conjunction is a filter which combines a given array of filters using
 * logical conjunction. This means that any element that passes the combined
 * test has passed all of the filters.
 * @param filters The filters to combine in conjunction.
 * @returns The logical conjunction of the given tests.
 */
export const conjunctionSync: FilterCompounderSync = <T>(
  filters: Array<FilterSync<T>>,
): FilterSync<T> => (element: T): boolean => {
  for (const filter of filters) {
    if (!filter(element)) {
      return false;
    }
  }
  return true;
};

/**
 * A disjunction is a filter which combines a given array of filters using
 * logical disjunction. This means that any element that passes the combined
 * test has passed at least one of the filters.
 * @param filters The filters to combine in disjunction.
 * @returns The logical disjunction of the given tests.
 */
export const disjunction: FilterCompounder = <T>(
  filters: Array<Filter<T> | FilterSync<T>>,
): Filter<T> => async (element: T): Promise<boolean> => {
  for (const filter of filters) {
    if (await filter(element)) {
      return true;
    }
  }
  return false;
};

/**
 * A disjunction is a filter which combines a given array of filters using
 * logical disjunction. This means that any element that passes the combined
 * test has passed at least one of the filters.
 * @param filters The filters to combine in disjunction.
 * @returns The logical disjunction of the given tests.
 */

export const disjunctionSync: FilterCompounderSync = <T>(
  filters: Array<FilterSync<T>>,
): FilterSync<T> => (element: T): boolean => {
  for (const filter of filters) {
    if (filter(element)) {
      return true;
    }
  }
  return false;
};

/**
 * Filters out elements of an iterable which don't pass all the given filters.
 * If there are no filters, then all the elements of the iterable are yielded.
 * @param iterable The iterable to filter.
 * @param filters The sequence of filters an element must pass in order to be
 * filtered in.
 * @throws If any of the filters throws an error for any of the elements of the
 * iterable.
 * @returns An iterator over the filtered elements.
 */
export async function* filter<T>(
  iterable: Iterable<T> | AsyncIterable<T>,
  filters: Array<Filter<T> | FilterSync<T>>,
): AsyncIterable<T> {
  if (filters.length > 0) {
    const filter = conjunction(filters);
    for await (const element of iterable) {
      if (await filter(element)) {
        yield element;
      }
    }
  } else {
    yield* iterable;
  }
}

/**
 * Filters out elements of an iterable which don't pass all the given filters.
 * If there are no filters, then all the elements of the iterable are yielded.
 * @param iterable The iterable to filter.
 * @param filters The sequence of filters an element must pass in order to be
 * filtered in.
 * @throws If any of the filters throws an error for any of the elements of the
 * iterable.
 * @returns An iterator over the filtered elements.
 */
export function* filterSync<T>(
  iterable: Iterable<T>,
  filters: Array<FilterSync<T>>,
): Iterable<T> {
  if (filters.length > 0) {
    const filter = conjunctionSync(filters);
    for (const element of iterable) {
      if (filter(element)) {
        yield element;
      }
    }
  } else {
    yield* iterable;
  }
}