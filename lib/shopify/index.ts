import { collection as collectionAPI, getDocs, query, where } from 'firebase/firestore';
import {
  HIDDEN_PRODUCT_TAG,
  // SHOPIFY_GRAPHQL_API_ENDPOINT,
  TAGS
} from 'lib/constants';
import { db } from 'lib/firebase';
import { ensureStartsWith } from 'lib/utils';
import {
  revalidateTag
} from 'next/cache';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  Cart,
  Collection,
  Connection,
  Image,
  Menu,
  Page,
  Product,
  ShopifyCart,
  ShopifyCollection,
  ShopifyProduct
} from './types';

const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? ensureStartsWith(process.env.SHOPIFY_STORE_DOMAIN, 'https://')
  : '';
// const endpoint = `${domain}${SHOPIFY_GRAPHQL_API_ENDPOINT}`;
const key = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

type ExtractVariables<T> = T extends { variables: object }
  ? T['variables']
  : never;

// export async function shopifyFetch<T>({
//   headers,
//   query,
//   variables
// }: {
//   headers?: HeadersInit;
//   query: string;
//   variables?: ExtractVariables<T>;
// }): Promise<{ status: number; body: T } | never> {
//   try {
//     const result = await fetch('http://localhost:3000', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'X-Shopify-Storefront-Access-Token': key,
//         ...headers
//       },
//       body: JSON.stringify({
//         ...(query && { query }),
//         ...(variables && { variables })
//       })
//     });

//     const body = await result.json();

//     if (body.errors) {
//       throw body.errors[0];
//     }

//     return {
//       status: result.status,
//       body
//     };
//   } catch (e) {
//     if (isShopifyError(e)) {
//       throw {
//         cause: e.cause?.toString() || 'unknown',
//         status: e.status || 500,
//         message: e.message,
//         query
//       };
//     }

//     throw {
//       error: e,
//       query
//     };
//   }
// }

const removeEdgesAndNodes = <T>(array: Connection<T>): T[] => {
  return array.edges.map((edge) => edge?.node);
};

const reshapeCart = (cart: ShopifyCart): Cart => {
  if (!cart.cost?.totalTaxAmount) {
    cart.cost.totalTaxAmount = {
      amount: '0.0',
      currencyCode: cart.cost.totalAmount.currencyCode
    };
  }

  return {
    ...cart,
    lines: removeEdgesAndNodes(cart.lines)
  };
};

const reshapeCollection = (
  collection: ShopifyCollection
): Collection | undefined => {
  if (!collection) {
    return undefined;
  }

  return {
    ...collection,
    path: `/search/${collection.handle}`
  };
};

const reshapeCollections = (collections: ShopifyCollection[]) => {
  const reshapedCollections = [];

  for (const collection of collections) {
    if (collection) {
      const reshapedCollection = reshapeCollection(collection);

      if (reshapedCollection) {
        reshapedCollections.push(reshapedCollection);
      }
    }
  }

  return reshapedCollections;
};

const reshapeImages = (images: Connection<Image>, productTitle: string) => {
  const flattened = removeEdgesAndNodes(images);

  return flattened.map((image) => {
    const filename = image.url.match(/.*\/(.*)\..*/)?.[1];
    return {
      ...image,
      altText: image.altText || `${productTitle} - ${filename}`
    };
  });
};

const reshapeProduct = (
  product: ShopifyProduct,
  filterHiddenProducts: boolean = true
) => {
  if (
    !product ||
    (filterHiddenProducts && product.tags.includes(HIDDEN_PRODUCT_TAG))
  ) {
    return undefined;
  }

  const { images, variants, ...rest } = product;

  return {
    ...rest,
    images: reshapeImages(images, product.title),
    variants: removeEdgesAndNodes(variants)
  };
};

const reshapeProducts = (products: ShopifyProduct[]) => {
  const reshapedProducts = [];

  for (const product of products) {
    if (product) {
      const reshapedProduct = reshapeProduct(product);

      if (reshapedProduct) {
        reshapedProducts.push(reshapedProduct);
      }
    }
  }

  return reshapedProducts;
};

export async function createCart(): Promise<Cart> {
  // const res = await shopifyFetch<ShopifyCreateCartOperation>({
  //   query: createCartMutation
  // });

  // return reshapeCart(res.body.data.cartCreate.cart);
  return Promise.resolve({
    id: 'gid://shopify/Cart/1',
    lines: [],
    checkoutUrl: '/checkout',
    totalQuantity: 0,
    cost: {
      subtotalAmount: {
        amount: '0.0',
        currencyCode: 'USD'
      },
      totalAmount: {
        amount: '0.0',
        currencyCode: 'USD'
      },
      totalTaxAmount: {
        amount: '0.0',
        currencyCode: 'USD'
      }
    },
  })
}

export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  // const cartId = (await cookies()).get('cartId')?.value!;
  // const res = await shopifyFetch<ShopifyAddToCartOperation>({
  //   query: addToCartMutation,
  //   variables: {
  //     cartId,
  //     lines
  //   }
  // });
  // return reshapeCart(res.body.data.cartLinesAdd.cart);
  return Promise.resolve({
    id: 'gid://shopify/Cart/1',
    lines: [],
    checkoutUrl: '/checkout',
    totalQuantity: 0,
    cost: {
      subtotalAmount: {
        amount: '0.0',
        currencyCode: 'USD'
      },
      totalAmount: {
        amount: '0.0',
        currencyCode: 'USD'
      },
      totalTaxAmount: {
        amount: '0.0',
        currencyCode: 'USD'
      }
    },
  })
}

export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  // const cartId = (await cookies()).get('cartId')?.value!;
  // const res = await shopifyFetch<ShopifyRemoveFromCartOperation>({
  //   query: removeFromCartMutation,
  //   variables: {
  //     cartId,
  //     lineIds
  //   }
  // });

  // return reshapeCart(res.body.data.cartLinesRemove.cart);
  return Promise.resolve({
    id: 'gid://shopify/Cart/1',
    lines: [],
    checkoutUrl: '/checkout',
    totalQuantity: 0,
    cost: {
      subtotalAmount: {
        amount: '0.0',
        currencyCode: 'USD'
      },
      totalAmount: {
        amount: '0.0',
        currencyCode: 'USD'
      },
      totalTaxAmount: {
        amount: '0.0',
        currencyCode: 'USD'
      }
    },
  })
}

export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  // const cartId = (await cookies()).get('cartId')?.value!;
  // const res = await shopifyFetch<ShopifyUpdateCartOperation>({
  //   query: editCartItemsMutation,
  //   variables: {
  //     cartId,
  //     lines
  //   }
  // });

  // return reshapeCart(res.body.data.cartLinesUpdate.cart);
  return Promise.resolve({
    id: 'gid://shopify/Cart/1',
    lines: [],
    checkoutUrl: '/checkout',
    totalQuantity: 0,
    cost: {
      subtotalAmount: {
        amount: '0.0',
        currencyCode: 'USD'
      },
      totalAmount: {
        amount: '0.0',
        currencyCode: 'USD'
      },
      totalTaxAmount: {
        amount: '0.0',
        currencyCode: 'USD'
      }
    },
  })
}

export async function getCart(): Promise<Cart | undefined> {
  // const cartId = (await cookies()).get('cartId')?.value;

  // if (!cartId) {
  //   return undefined;
  // }

  // const res = await shopifyFetch<ShopifyCartOperation>({
  //   query: getCartQuery,
  //   variables: { cartId }
  // });

  // // Old carts becomes `null` when you checkout.
  // if (!res.body.data.cart) {
  //   return undefined;
  // }

  // return reshapeCart(res.body.data.cart);
  return Promise.resolve({
    id: 'gid://shopify/Cart/1',
    lines: [],
    checkoutUrl: '/checkout',
    totalQuantity: 0,
    cost: {
      subtotalAmount: {
        amount: '0.0',
        currencyCode: 'USD'
      },
      totalAmount: {
        amount: '0.0',
        currencyCode: 'USD'
      },
      totalTaxAmount: {
        amount: '0.0',
        currencyCode: 'USD'
      }
    },
  })
}

export async function getCollection(
  handle: string
): Promise<Collection | undefined> {
  // 'use cache';
  // cacheTag(TAGS.collections);
  // cacheLife('days');

  // const res = await shopifyFetch<ShopifyCollectionOperation>({
  //   query: getCollectionQuery,
  //   variables: {
  //     handle
  //   }
  // });

  // return reshapeCollection(res.body.data.collection);
  return Promise.resolve(undefined)
}

export async function getCollectionProducts({
  collection,
  reverse,
  sortKey
}: {
  collection: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  const productDocs = collectionAPI(db, 'product');
  const productSnapshot = await getDocs(productDocs);
  const products: Partial<Product>[] = []
  productSnapshot.forEach(item => {
    console.log(item.data())
    products.push(item.data())
  })

  // 'use cache';
  // cacheTag(TAGS.collections, TAGS.products);
  // cacheLife('days');

  // const res = await shopifyFetch<ShopifyCollectionProductsOperation>({
  //   query: getCollectionProductsQuery,
  //   variables: {
  //     handle: collection,
  //     reverse,
  //     sortKey: sortKey === 'CREATED_AT' ? 'CREATED' : sortKey
  //   }
  // });

  // if (!res.body.data.collection) {
  //   console.log(`No collection found for \`${collection}\``);
  //   return [];
  // }

  // return reshapeProducts(
  //   removeEdgesAndNodes(res.body.data.collection.products)
  // );
  console.log(products)
  return products.map(product => {
    return {
      id: 'gid://shopify/Product/1',
      title: 'Product Title',
      description: 'Product Description',
      tags: [],
      availableForSale: true,
      handle: 'product-title',
      descriptionHtml: '<p>Product Description</p>',
      options: [],
      priceRange: {
        maxVariantPrice: {
          amount: '100.00',
          currencyCode: 'USD'
        },
        minVariantPrice: {
          amount: '100.00',
          currencyCode: 'USD'
        },
      },
      featuredImage: {
        url: 'https://cdn.shopify.com/s/files/1/0000/0000/0000/products/product-image.jpg',
        altText: 'Product Image',
        width: 100,
        height: 100,
      },
      seo: {
        title: 'Product Title',
        description: 'Product Description'
      },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      variants: [
        {
          id: 'gid://shopify/ProductVariant/1',
          title: 'Default Title',
          availableForSale: true,
          selectedOptions: [
            {
              name: 'Title',
              value: 'Default Title'
            }
          ],
          price: {
            amount: '100.00',
            currencyCode: 'USD'
          }
        }
      ],
      images: [
        {
          url: 'https://cdn.shopify.com/s/files/1/0000/0000/0000/products/product-image.jpg',
          altText: 'Product Image',
          width: 100,
          height: 100
        }
      ],
      ...product
    }
  })
}

export async function getCollections(): Promise<Collection[]> {
  // 'use cache';
  // cacheTag(TAGS.collections);
  // cacheLife('days');

  // const res = await shopifyFetch<ShopifyCollectionsOperation>({
  //   query: getCollectionsQuery
  // });
  const res = {body: {data: {collections: {edges: []}}}}
  const shopifyCollections = removeEdgesAndNodes(res.body?.data?.collections);
  const collections = [
    {
      handle: '',
      title: 'All',
      description: 'All products',
      seo: {
        title: 'All',
        description: 'All products'
      },
      path: '/search',
      updatedAt: new Date().toISOString()
    },
    // Filter out the `hidden` collections.
    // Collections that start with `hidden-*` need to be hidden on the search page.
    // ...reshapeCollections(shopifyCollections).filter(
    //   (collection) => !collection.handle.startsWith('hidden')
    // )
  ];

  return collections;
}

export async function getMenu(handle: string): Promise<Menu[]> {
  // 'use cache';
  // cacheTag(TAGS.collections);
  // cacheLife('days');

  // const res = await shopifyFetch<ShopifyMenuOperation>({
  //   query: getMenuQuery,
  //   variables: {
  //     handle
  //   }
  // });

  // return (
  //   res.body?.data?.menu?.items.map((item: { title: string; url: string }) => ({
  //     title: item.title,
  //     path: item.url
  //       .replace(domain, '')
  //       .replace('/collections', '/search')
  //       .replace('/pages', '')
  //   })) || []
  // );
  return Promise.resolve([])
}

export async function getPage(handle: string): Promise<Page> {
  // const res = await shopifyFetch<ShopifyPageOperation>({
  //   query: getPageQuery,
  //   variables: { handle }
  // });

  // return res.body.data.pageByHandle;
  return Promise.resolve({
    id: 'gid://shopify/Page/1',
    title: 'Page Title',
    handle: 'page-title',
    body: '<p>Page Content</p>',
    bodySummary: 'Page Summary',
    seo: {
      title: 'Page Title',
      description: 'Page Description'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

}

export async function getPages(): Promise<Page[]> {
  // const res = await shopifyFetch<ShopifyPagesOperation>({
  //   query: getPagesQuery
  // });

  // return removeEdgesAndNodes(res.body.data.pages);
  return Promise.resolve([
    {
      id: 'gid://shopify/Page/1',
      title: 'Page Title',
      handle: 'page-title',
      body: '<p>Page Content</p>',
      bodySummary: 'Page Summary',
      seo: {
        title: 'Page Title',
        description: 'Page Description'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ])
}

export async function getProduct(id: string): Promise<Product | undefined> {
  // 'use cache';
  // cacheTag(TAGS.products);
  // cacheLife('days');

  // const res = await shopifyFetch<ShopifyProductOperation>({
  //   query: getProductQuery,
  //   variables: {
  //     handle
  //   }
  // });

  // return reshapeProduct(res.body.data.product, false);
  const productsRef = collectionAPI(db, "product")
  // console.log(id)
  const q = query(productsRef, where("id", "==", 1))
  const productsSnapshot = await getDocs(q)
  let product
  productsSnapshot.forEach(item => {
    product = item.data()
  })
  console.log(product)
  return {
    id: 'gid://shopify/Product/1',
    title: 'Product Title',
    description: 'Product Description',
    tags: [],
    availableForSale: true,
    handle: 'product-title',
    descriptionHtml: '<p>Product Description</p>',
    options: [],
    priceRange: {
      maxVariantPrice: {
        amount: '100.00',
        currencyCode: 'USD'
      },
      minVariantPrice: {
        amount: '100.00',
        currencyCode: 'USD'
      },
    },
    featuredImage: {
      url: '',
      altText: 'Product Image',
      width: 100,
      height: 100,
    },
    seo: {
      title: 'Product Title',
      description: 'Product Description'
    },
    // createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    variants: [
      {
        id: 'gid://shopify/ProductVariant/1',
        title: 'Default Title',
        availableForSale: true,
        selectedOptions: [
          {
            name: 'Title',
            value: 'Default Title'
          }
        ],
        price: {
          amount: '100.00',
          currencyCode: 'USD'
        }
      }
    ],
    images: [
      {
        url: '',
        altText: 'Product Image',
        width: 100,
        height: 100
      }
    ],
    ...(product ?? {}),
  }
}

export async function getProductRecommendations(
  productId: string
): Promise<Product[]> {
  // 'use cache';
  // cacheTag(TAGS.products);
  // cacheLife('days');

  // const res = await shopifyFetch<ShopifyProductRecommendationsOperation>({
  //   query: getProductRecommendationsQuery,
  //   variables: {
  //     productId
  //   }
  // });

  // return reshapeProducts(res.body.data.productRecommendations);
  return Promise.resolve([
    {
      id: 'gid://shopify/Product/1',
      title: 'Product Title',
      description: 'Product Description',
      tags: [],
      availableForSale: true,
      handle: 'product-title',
      descriptionHtml: '<p>Product Description</p>',
      options: [],
      priceRange: {
        maxVariantPrice: {
          amount: '100.00',
          currencyCode: 'USD'
        },
        minVariantPrice: {
          amount: '100.00',
          currencyCode: 'USD'
        },
      },
      featuredImage: {
        url: 'https://cdn.shopify.com/s/files/1/0000/0000/0000/products/product-image.jpg',
        altText: 'Product Image',
        width: 100,
        height: 100,
      },
      seo: {
        title: 'Product Title',
        description: 'Product Description'
      },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      variants: [
        {
          id: 'gid://shopify/ProductVariant/1',
          title: 'Default Title',
          availableForSale: true,
          selectedOptions: [
            {
              name: 'Title',
              value: 'Default Title'
            }
          ],
          price: {
            amount: '100.00',
            currencyCode: 'USD'
          }
        }
      ],
      images: [
        {
          url: 'https://cdn.shopify.com/s/files/1/0000/0000/0000/products/product-image.jpg',
          altText: 'Product Image',
          width: 100,
          height: 100
        }
      ]
    }])
}

export async function getProducts({
  query,
  reverse,
  sortKey
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  // 'use cache';
  // cacheTag(TAGS.products);
  // cacheLife('days');

  // const res = await shopifyFetch<ShopifyProductsOperation>({
  //   query: getProductsQuery,
  //   variables: {
  //     query,
  //     reverse,
  //     sortKey
  //   }
  // });

  // return reshapeProducts(removeEdgesAndNodes(res.body.data.products));
  return Promise.resolve([
    {
      id: 'gid://shopify/Product/1',
      title: 'Product Title',
      description: 'Product Description',
      tags: [],
      availableForSale: true,
      handle: 'product-title',
      descriptionHtml: '<p>Product Description</p>',
      options: [],
      priceRange: {
        maxVariantPrice: {
          amount: '100.00',
          currencyCode: 'USD'
        },
        minVariantPrice: {
          amount: '100.00',
          currencyCode: 'USD'
        },
      },
      featuredImage: {
        url: 'https://cdn.shopify.com/s/files/1/0000/0000/0000/products/product-image.jpg',
        altText: 'Product Image',
        width: 100,
        height: 100,
      },
      seo: {
        title: 'Product Title',
        description: 'Product Description'
      },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      variants: [
        {
          id: 'gid://shopify/ProductVariant/1',
          title: 'Default Title',
          availableForSale: true,
          selectedOptions: [
            {
              name: 'Title',
              value: 'Default Title'
            }
          ],
          price: {
            amount: '100.00',
            currencyCode: 'USD'
          }
        }
      ],
      images: [
        {
          url: 'https://cdn.shopify.com/s/files/1/0000/0000/0000/products/product-image.jpg',
          altText: 'Product Image',
          width: 100,
          height: 100
        }
      ]
    }
  ])
}

// This is called from `app/api/revalidate.ts` so providers can control revalidation logic.
export async function revalidate(req: NextRequest): Promise<NextResponse> {
  // We always need to respond with a 200 status code to Shopify,
  // otherwise it will continue to retry the request.
  const collectionWebhooks = [
    'collections/create',
    'collections/delete',
    'collections/update'
  ];
  const productWebhooks = [
    'products/create',
    'products/delete',
    'products/update'
  ];
  const topic = (await headers()).get('x-shopify-topic') || 'unknown';
  const secret = req.nextUrl.searchParams.get('secret');
  const isCollectionUpdate = collectionWebhooks.includes(topic);
  const isProductUpdate = productWebhooks.includes(topic);

  if (!secret || secret !== process.env.SHOPIFY_REVALIDATION_SECRET) {
    console.error('Invalid revalidation secret.');
    return NextResponse.json({ status: 401 });
  }

  if (!isCollectionUpdate && !isProductUpdate) {
    // We don't need to revalidate anything for any other topics.
    return NextResponse.json({ status: 200 });
  }

  if (isCollectionUpdate) {
    revalidateTag(TAGS.collections);
  }

  if (isProductUpdate) {
    revalidateTag(TAGS.products);
  }

  return NextResponse.json({ status: 200, revalidated: true, now: Date.now() });
}
