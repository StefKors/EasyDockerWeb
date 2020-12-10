import axios from 'axios'
import {message} from 'antd';

// const isDev = process.env.NODE_ENV === 'development';

const service = axios.create({
    // baseURL: isDev ? 'http://localhost:3100' : ''
});

service.interceptors.request.use((config) => {
    return config
});

service.interceptors.response.use((resp) => {
    if (resp.status === 200) {
        return resp.data;
    } else {
        message.error('This is an error message');
    }
});

export const getInfoOverView = async () => {
    return service.get("/api/overview");
};

export const getContainers = async () => {
    return service.get("/api/containers");
};

export const getStartContainerById = async (id) => {
    return service.get("/api/containers/start/" + id);
};
export const getStopContainerById = async (id) => {
    return service.get("/api/containers/stop/" + id);
};
export const getDeleteContainerById = async (id) => {
    return service.get("/api/containers/remove/" + id);
};

export const getImages = async () => {
    return service.get("/api/images");
};
export const getDeleteImagesById = async (id) => {
    return service.get("/api/images/remove/" + id);
};

export const searchImage = async (name) => {
    return service.get("/api/search/" + name);
};