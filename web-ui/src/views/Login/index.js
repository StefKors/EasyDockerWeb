import React, {Component} from 'react';
import {Button, Card, Checkbox, Form, Input} from 'antd';
import { LockTwoTone  } from '@ant-design/icons';

import "./login.css"

class Login extends Component {
    formRef = React.createRef();

    handleSubmit = e => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                console.log('Received values of form: ', values);
            }
        });
    };

    render() {
        const {getFieldDecorator} = this.props.form;
        return (
            <Card title="Easy Docker Web" className="loginWeb">
                <Form onSubmit={this.handleSubmit} className="login-form" ref={this.formRef}>
                    <Form.Item>
                        {getFieldDecorator('password', {
                            rules: [{required: true, message: 'Please input your Password!'}],
                        })(
                            <Input
                                prefix={<LockTwoTone twoToneColor="rgba(0,0,0,.25)" />}
                                type="password"
                                placeholder="Password"
                            />,
                        )}
                    </Form.Item>
                    <Form.Item>
                        {getFieldDecorator('remember', {
                            valuePropName: 'checked',
                            initialValue: true,
                        })(<Checkbox>Remember me</Checkbox>)}
                        <Button type="primary" htmlType="submit" className="login-form-button">
                            Log in
                        </Button>

                    </Form.Item>
                </Form>
            </Card>
        );
    }
}

export default Login