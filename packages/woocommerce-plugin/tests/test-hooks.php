<?php
/**
 * Test WooCommerce hooks.
 * Run with: vendor/bin/phpunit tests/
 */

class Test_SerenAI_Hooks extends WP_UnitTestCase {

    private $api_mock;
    private $hooks;

    public function setUp(): void {
        parent::setUp();

        // Create mock API
        $this->api_mock = $this->createMock(SerenAI_API::class);
        $this->api_mock->method('is_registered')->willReturn(true);

        $this->hooks = new SerenAI_Hooks($this->api_mock);
    }

    public function test_checkout_started_sends_event() {
        $this->api_mock->expects($this->once())
            ->method('send_event')
            ->with(
                $this->equalTo('checkout_started'),
                $this->isType('array')
            );

        $this->hooks->on_checkout_started();
    }

    public function test_order_failed_sends_event_with_failed_status() {
        $order = wc_create_order();
        $order->set_total(99.99);
        $order->save();

        $this->api_mock->expects($this->once())
            ->method('send_event')
            ->with(
                $this->equalTo('order_failed'),
                $this->callback(function($data) {
                    return $data['financial_status'] === 'failed';
                })
            );

        $this->hooks->on_order_failed($order->get_id(), $order);
    }
}
