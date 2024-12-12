import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { fn } from "@ember/helper";
import { action } from "@ember/object";
import { LinkTo } from "@ember/routing";
import { service } from "@ember/service";
import DButton from "discourse/components/d-button";
import DropdownMenu from "discourse/components/dropdown-menu";
import avatar from "discourse/helpers/avatar";
import formatDate from "discourse/helpers/format-date";
import { popupAjaxError } from "discourse/lib/ajax-error";
import dIcon from "discourse-common/helpers/d-icon";
import { i18n } from "discourse-i18n";
import DMenu from "float-kit/components/d-menu";
import WebhookStatus from "admin/components/webhook-status";

export default class WebhookItem extends Component {
  @service router;

  @tracked webhook = this.args.webhook;
  deliveryStatuses = this.args.deliveryStatuses;

  @action
  onRegisterApi(api) {
    this.dMenu = api;
  }

  @action
  destroyWebhook() {

  }

  @action
  edit() {
    this.router.transitionTo("adminWebHooks.edit", this.webhook);
  }

  <template>
    <tr class="d-admin-row__content">
      <td class="d-admin-row__overview key">
        <LinkTo @route="adminWebHooks.show" @model={{this.webhook}}>
          <WebhookStatus
            @deliveryStatuses={{this.deliveryStatuses}}
            @webhook={{this.webhook}}
          />
        </LinkTo>
      </td>
      <td class="d-admin-row__detail">
        <LinkTo @route="adminWebHooks.edit" @model={{this.webhook}}>
          {{this.webhook.payload_url}}
        </LinkTo>
      </td>
      <td class="d-admin-row__detail">
        {{this.webhook.description}}
      </td>
      <td class="d-admin-row__controls key-controls">
        <div class="d-admin-row__controls-options">
          <DButton
            @action={{this.edit}}
            @label="admin.api_keys.edit"
            @title="admin.api.show_details"
            class="btn-small"
          />
          <DMenu
            @identifier="api_key-menu"
            @title={{i18n "admin.config_areas.user_fields.more_options.title"}}
            @icon="ellipsis-vertical"
            @onRegisterApi={{this.onRegisterApi}}
          >
            <:content>
              <DropdownMenu as |dropdown|>
                <dropdown.item>
                  <DButton
                    @action={{fn this.destroyWebhook this.webhook}}
                    @icon="trash-can"
                    @label="admin.web_hooks.delete"
                    @title="admin.web_hooks.delete"
                    class="btn-transparent admin-flag-item__delete"
                  />
                </dropdown.item>
              </DropdownMenu>
            </:content>
          </DMenu>
        </div>
      </td>
    </tr>
  </template>
}
