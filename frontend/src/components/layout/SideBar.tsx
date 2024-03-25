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

import { Link, NavLink } from 'react-router-dom';

import HomeIcon from '@/assets/icons/home.svg';
import CatalogIcon from '@/assets/icons/catalog.svg';
import StockIcon from '@/assets/icons/stock.svg';
import TrashIcon from '@/assets/icons/trash.svg';
import { Role } from '@models/types/auth/role';
import { useAuth } from '@hooks/useAuth';
import { Box, Button, List, ListItem } from '@mui/material';
import Text from '../../theme/components/Text';
import Logo from '../../theme/components/Logo';

type SideBarItemProps = (
    | {
          variant?: 'link';
          path: string;
      }
    | {
          variant: 'button';
          action?: () => void;
      }
) & {
    name: string;
    icon: string;
    requiredRoles?: Role[];
};

const sideBarItems: SideBarItemProps[] = [
    {
        name: 'Stocks',
        icon: StockIcon,
        path: '/stocks',
    },
    {
        name: 'Catalog',
        icon: CatalogIcon,
        path: '/catalog',
        requiredRoles: ['PURIS_ADMIN'],
    },
    {
        name: 'Negotiations',
        icon: CatalogIcon,
        path: '/negotiations',
        requiredRoles: ['PURIS_ADMIN'],
    },
    {
        name: 'Transfers',
        icon: CatalogIcon,
        path: '/transfers',
        requiredRoles: ['PURIS_ADMIN'],
    },
    {
        name: 'Supplier Dashboard',
        icon: HomeIcon,
        path: '/supplierDashboard',
    },
    {
        name: 'Logout',
        icon: TrashIcon,
        variant: 'button',
    },
];

const calculateClassName = ({ isActive = false, isPending = false, isTransitioning = false }) => {
    const defaultClasses = 'side-menu-item';
    return `${defaultClasses}${isActive || isPending || isTransitioning ? ' active' : ''}`;
}

const SideBarItem = (props: SideBarItemProps) => {
    const { hasRole } = useAuth();
    if (props.requiredRoles && !hasRole(props.requiredRoles)) {
        return null;
    }
    return (
        <ListItem sx={{ padding: 0 }} key={props.name}>
            {props.variant === 'button' ? (
                <Button className={calculateClassName({})} onClick={props.action}>
                    <Box component="img" mr="0.5rem" src={props.icon} alt="Icon" />
                    <Text overflow-wrap="break-word">{props.name}</Text>
                </Button>
            ) : (
                <NavLink to={props.path} className={calculateClassName}>
                    <Box component="img" mr="0.5rem" src={props.icon} alt="Icon" />
                    <Text overflow-wrap="break-word">{props.name}</Text>
                </NavLink>
            )}
        </ListItem>
    );
}

export const SideBar = () => {
    return (
        <Box
            component="aside"
            sx={{
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                gap: '1.5rem',
                width: '16rem',
                borderRightWidth: '1px',
                padding: '1.25rem 0.75rem',
                overflowY: 'auto'
            }}>
            <Box component="header" display="flex" justifyContent="center">
                <Logo>PURIS</Logo>
            </Box>
            <Box component="nav">
                <List sx={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {sideBarItems.map((item) => (
                        <SideBarItem key={item.name} {...item} />
                    ))}
                </List>
            </Box>
            <Box component="footer" display="flex" justifyContent="center" mt="auto">
                <Link to="/aboutLicense">
                    About License
                </Link>
            </Box>
        </Box>
    );
}
