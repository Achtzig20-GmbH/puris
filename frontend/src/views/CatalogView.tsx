/*
Copyright (c) 2022,2024 Volkswagen AG
Copyright (c) 2022,2024 Fraunhofer-Gesellschaft zur Foerderung der angewandten Forschung e.V. (represented by Fraunhofer ISST)
Copyright (c) 2022,2024 Contributors to the Eclipse Foundation

See the NOTICE file(s) distributed with this work for additional
information regarding copyright ownership.

This program and the accompanying materials are made available under the
terms of the Apache License, Version 2.0 which is available at
https://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations
under the License.

SPDX-License-Identifier: Apache-2.0
*/

import { Input } from '@catena-x/portal-shared-components';
import { useCatalog } from '@hooks/edc/useCatalog';
import { useRef, useState } from 'react';
import { CatalogOperation } from '@models/types/edc/catalog';
import { Box, Card, List, ListItem } from '@mui/material';
import { getCatalogOperator } from '@util/helpers';
import CustomButton from '../theme/components/CustomButton';
import Text from '../theme/components/Text';
import Subtitle from '../theme/components/Subtitle';
import Subtitle2 from '../theme/components/Subtitle2';


type OperationListProps = {
    title: string;
    operations: CatalogOperation[];
};

const OperationList = ({ title, operations }: OperationListProps) => {
    return (
        <>
            <Text fontWeight="600">{title}</Text>
            {operations && operations.length > 0 ? (
                <List>
                    {operations.map((operation, index) => (
                        <ListItem key={index}>
                            {`${operation['odrl:constraint']['odrl:leftOperand']} ${getCatalogOperator(
                                operation['odrl:constraint']['odrl:operator']['@id']
                            )} ${operation['odrl:constraint']['odrl:rightOperand']}`}
                        </ListItem>
                    ))}
                </List>
            ) : (
                <Text>None</Text>
            )}
        </>
    );
};

export const CatalogView = () => {
    const [edcUrl, setEdcUrl] = useState<string | null>(null);
    const { catalog, catalogError } = useCatalog(edcUrl);
    const urlRef = useRef<string | null>(null);
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            height: '100%',
            width: '100%'
        }}>
            <Subtitle>View EDC Catalog</Subtitle>
            <Box sx={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '1.25rem'
            }}>
                <Input
                    label="EDC URL"
                    type="text"
                    id="edc-url"
                    placeholder="Enter URL"
                    margin="none"
                    onChange={(event) => (urlRef.current = event.target.value)}
                />
                <Box mb="0.75rem">
                    <CustomButton
                        onClick={() => setEdcUrl(urlRef?.current)}>
                            Get Catalog
                    </CustomButton>
                </Box>
            </Box>
            {catalog && catalog.length > 0 ? (
                <List sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                    width: '64rem'
                }}>
                    {catalog.map((item, index) => (
                        <ListItem key={index}>
                            <Card sx={{ padding: '1.25rem' }}>
                                <Subtitle2 fontWeight="600">Catalog Item</Subtitle2>
                                <Box sx={{
                                    display: 'flex',
                                    width: '100%',
                                    justifyContent: 'flex-start',
                                    gap: '1rem'
                                }}>
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.25rem',
                                        width: '70ch'
                                    }}>
                                        <Box display="flex">
                                            <Text fontWeight="600" width="20ch">Asset ID: </Text>
                                            "{item.assetId}"
                                        </Box>
                                        <Box display="flex">
                                            <Text fontWeight="600" width="20ch">Asset type: </Text>
                                            "{item.assetType}"
                                        </Box>
                                        <Box display="flex">
                                            <Text fontWeight="600" width="20ch">Asset action: </Text>
                                            {item.permission['odrl:action']['odrl:type']} {item.permission['odrl:target']}
                                        </Box>
                                        <Box display="flex">
                                            <Text fontWeight="600" width="20ch">Asset condition: </Text>
                                            {item.permission['odrl:constraint']['odrl:leftOperand'] + ' '}
                                            {getCatalogOperator(item.permission['odrl:constraint']['odrl:operator']['@id']) + ' '}
                                            {item.permission['odrl:constraint']['odrl:rightOperand']}
                                        </Box>
                                    </Box>
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        width: '33.33%',
                                        flexShrink: 0
                                    }}>
                                        <OperationList title="The following prohibitions are defined:" operations={item.prohibitions} />
                                        <OperationList title="The following obligations are defined:" operations={item.obligations} />
                                    </Box>
                                </Box>
                            </Card>
                        </ListItem>
                    ))}
                </List>
            ) : (
                <Box py="1.25rem">
                    {catalogError != null ? (
                        <Text color="error">There was an error retrieving the Catalog from {edcUrl}</Text>
                    ) : (
                        <Text> {`No Catalog available for ${edcUrl}`} </Text>
                    )}
                </Box>
            )}
        </Box>
    );
};
