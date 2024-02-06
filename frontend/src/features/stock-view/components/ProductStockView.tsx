/*
Copyright (c) 2024 Volkswagen AG
Copyright (c) 2024 Fraunhofer-Gesellschaft zur Foerderung der angewandten Forschung e.V. (represented by Fraunhofer ISST)
Copyright (c) 2024 Contributors to the Eclipse Foundation

See the NOTICE file(s) distributed with this work for additional
information regarding copyright ownership.

This program and the accompanying products are made available under the
terms of the Apache License, Version 2.0 which is available at
https://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations
under the License.

SPDX-License-Identifier: Apache-2.0
*/

import { useState } from 'react';
import { StockUpdateForm } from './StockUpdateForm';
import { PartnerStockTable } from './PartnerStockTable';
import { StockTable } from './StockTable';
import { useProducts } from '../hooks/useProducts';
import { ProductStock } from '../../../models/types/data/stock';

export function ProductStockView() {
    const { products } = useProducts();
    const [selectedProduct, setSelectedProduct] = useState<ProductStock | null>(null);
    return (
        <div className='flex flex-col gap-10 pb-5'>
            <div className='mx-auto'>
                <StockUpdateForm
                    items={products}
                    type='product'
                    selectedItem={selectedProduct}
                />
            </div>
            <StockTable<ProductStock> type='product' onSelection={setSelectedProduct} />
            <PartnerStockTable type='product' materialNumber={selectedProduct?.material?.materialNumberCustomer}/>
        </div>
    );
}