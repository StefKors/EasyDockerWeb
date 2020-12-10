import React, {useEffect, useRef, useState, useCallback} from 'react';
import {Button, Card, message, Modal, Table, Tag, Tooltip} from 'antd';
import { PlusOutlined, DeleteOutlined,CaretRightOutlined, StopOutlined  } from '@ant-design/icons';
import {getContainers, getDeleteContainerById, getStartContainerById, getStopContainerById} from "../../requests";
import ButtonGroup from "antd/es/button/button-group";
import { calculateCPUPercentUnix } from './calculateCPUPercentUnix';
import deepEqual from 'deep-equal'

const STATE_COLOR_MAP = {
    "running": "green",
    "exited": "red",
    "created": "yellow"
};

const socket = require('socket.io-client')('http://localhost:3000');
const Containers = () => {
    const [dataSource, setDataSource] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [modalIsVisible, setModalIsVisible] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const dataRef = useRef([]);
    const useSocket = useRef(false);

    const columns = [
        {
            title: 'Names',
            dataIndex: 'Names',
            key: 'Names',
        },
        {
            title: 'Image',
            dataIndex: 'Image',
            key: 'Image',
            ellipsis: {
                showTitle: false,
            },
            render: label => (
                <Tooltip placement="topLeft" title={label}>
                    {label}
                </Tooltip>
            ),
        },
        {
            title: 'Ports',
            dataIndex: 'Ports',
            key: 'Ports',
        },
        {
            title: 'State',
            dataIndex: 'State',
            key: 'State',
            render: (text, record) => {
                return <Tag color={STATE_COLOR_MAP[record.State]}>{record.State}</Tag>
            }
        },
        {
            title: 'CPU',
            dataIndex: 'cpu',
            key: 'cpu',
            render: (text, record) => {
                return (
                    <p>{record.cpu ? record.cpu : null}</p>
                )
            }
        },
        {
            title: 'RAM',
            dataIndex: 'ram',
            key: 'ram',
            render: (text, record) => {
                return (
                    <p>{record.ram ? record.ram : null}</p>
                )
            }
        },
        {
            title: 'Operation',
            dataIndex: 'operation',
            key: 'operation',
            width: 250,
            align: 'right',
            render: (text, record) => {
                return (
                    <ButtonGroup>
                        {record.State !== 'running' && (
                            <Button size="small" type="primary"
                                loading={record.startLoading}
                                disabled={record.State === 'running' ? true : false}
                                onClick={() => startContainerHandler(record.key)}>
                                <CaretRightOutlined />Start</Button>
                        )}
                        {record.State !== 'exited' && (
                            <Button size="small"
                                loading={record.stopLoading}
                                disabled={record.State === 'exited' ? true : false}
                                onClick={() => stopContainerHandler(record.key)}>
                                <StopOutlined />Stop
                            </Button>
                        )}
                        <Button size="small" type="danger"
                            loading={record.deleteLoading}
                            onClick={() => deleteContainerHandler(record.key)}>
                            <DeleteOutlined /></Button>
                    </ButtonGroup>
                )
        
            }
        },
    ];

    const updateContainerStateByData = useCallback((data) => {
        const containerIndex = dataRef.current.findIndex(container => {
            return container.key === data.id;
        });

        const container = {
            ...dataRef.current[containerIndex]
        };

        container.ram = getContainerRAMInfo(data) ? getContainerRAMInfo(data) + " %" : "NO DATA";
        container.cpu = calculateCPUPercentUnix(data) ? calculateCPUPercentUnix(data) + " %" : "NO DATA";

        // copy of containers
        const containers = [...dataRef.current];
        containers[containerIndex] = container;
        dataRef.current = containers;
        setDataSource(containers);
    }, []);

    const updateContainerStateById = (id, type, isActive) => {
        const newMapToUpdate = dataRef.current.map((data) => {
            if (data.key === id) {
                data[type] = isActive;
            }
            return data;
        });
        setIsLoading(isActive);
        setDataSource(newMapToUpdate);
    };
    
    const startContainerHandler = async (id) => {
        try {
            console.log("startContainerHandler: " + id);

            updateContainerStateById(id, "startLoading", true);
            await getStartContainerById(id)
            updateContainerStateById(id, "startLoading", false);
        } catch (error) {
            message.error(error.toString());
        }
    };

    const stopContainerHandler = async (id) => {
        try {
            console.log("stopContainerHandler: " + id);
            socket.off('containerInfo');
            useSocket.current = false;
    
            updateContainerStateById(id, "stopLoading", true);
            await getStopContainerById(id)
            updateContainerStateById(id, "stopLoading", false);
        } catch (error) {
            message.error(error.toString());
        }
    };

    const deleteContainerHandler = async (id) => {
        try {
            console.log("deleteContainerHandler: " + id);
            socket.off('containerInfo');
            useSocket.current = false;

            updateContainerStateById(id, "deleteLoading", true);
            await getDeleteContainerById(id)
            updateContainerStateById(id, "deleteLoading", false);
        } catch (error) {
            message.error(error.toString());
        }
    };

    const updateContainersList = async () => {
        try {
            setIsLoading(true);
            const containers = await getContainers()
            if (containers) {
                const newDataSource = containers.map((container) => {
                    socket.emit('getContainersInfo', container.Id);
                    const ports = container.Ports.map(port => {
                        let tmp = '';
                        if (port.IP) {
                            tmp = " -> " + port.IP + ":" + port.PublicPort
                        }
                        return "[" + port.Type + "] " + port.PrivatePort + tmp + "; ";
                    });
                    console.log(container);
                    return {
                        key: container.Id,
                        Names: container.Names[0].split("/")[1],
                        Image: container.Image,
                        Ports: ports,
                        State: container.State,
                        cpu: 'NO DATA',
                        ram: 'NO DATA',
                        startLoading: false,
                        stopLoading: false,
                        deleteLoading: false
                    }
                });

                if (!deepEqual(dataSource, newDataSource)) {
                    setDataSource(newDataSource);
                    dataRef.current = newDataSource;
                }
                // return tmp;
            }
            setIsLoading(false);
        } catch (error) {
            message.error(error.toString());
        }
    };

    const showModal = () => {
        setModalIsVisible(true);
    };

    const handleOk = () => {
        setConfirmLoading(true);
        setTimeout(() => {
            setModalIsVisible(false);
            setConfirmLoading(false);
        }, 2000);
    };

    const handleCancel = () => {
        console.log('Clicked cancel button');
        setModalIsVisible(false);
    };


    const getContainerRAMInfo = (json) => {
        if (json.memory_stats.usage) {
            return ((json.memory_stats.usage / json.memory_stats.limit) * 100).toFixed(2);
        }
    };

    useEffect(() => {
        updateContainersList();
        return () => {
            socket.emit('end');
            socket.off('containerInfo');
        }
    }, [dataSource]);

    useEffect(() => {
        console.log("dataSource Changed")
        if (!useSocket.current && dataSource.length > 0) {
            console.log("start data ....");
            console.log("dataSource:" + dataSource.length);
            console.log("dataRef.current:" + dataRef.current.length)
            socket.on('containerInfo', (data) => {
                if (data.pids_stats.current) {
                    updateContainerStateByData(data);
                }
            });
            useSocket.current = true;
        }
    }, []);

    return (
        <Card title="Containers" bordered={false}>
            <Button type="primary" style={{marginBottom: '8px'}} onClick={showModal}>
                <PlusOutlined />
                New container
            </Button>
            <Table dataSource={dataSource}
                   loading={isLoading}
                   columns={columns}
            />
            <Modal
                title="New container"
                visible={modalIsVisible}
                onOk={handleOk}
                confirmLoading={confirmLoading}
                onCancel={handleCancel}
            >
                <p>test</p>
            </Modal>
        </Card>

    );

};

export default Containers;