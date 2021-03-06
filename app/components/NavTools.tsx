import Vue from 'vue';
import cx from 'classnames';
import electron from 'electron';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { NavigationService, TAppPage } from 'services/navigation';
import { UserService } from 'services/user';
import { SettingsService } from 'services/settings';
import Utils from 'services/utils';
import { TransitionsService } from 'services/transitions';
import { $t } from 'services/i18n';
import styles from './SideNav.m.less';
import { MagicLinkService } from 'services/magic-link';
import { throttle } from 'lodash-decorators';
import { RestreamService } from 'services/restream';

@Component({})
export default class SideNav extends Vue {
  @Inject() userService: UserService;
  @Inject() transitionsService: TransitionsService;
  @Inject() settingsService: SettingsService;
  @Inject() navigationService: NavigationService;
  @Inject() magicLinkService: MagicLinkService;
  @Inject() restreamService: RestreamService;

  get isDevMode() {
    return Utils.isDevMode();
  }

  get chatbotVisible() {
    return (
      this.userService.isLoggedIn &&
      ['twitch', 'mixer', 'youtube'].includes(this.userService.platform.type)
    );
  }

  openSettingsWindow(categoryName?: string) {
    this.settingsService.showSettings(categoryName);
  }

  navigate(page: TAppPage) {
    this.navigationService.navigate(page);
  }

  openDevTools() {
    electron.ipcRenderer.send('openDevTools');
  }

  studioMode() {
    if (this.transitionsService.state.studioMode) {
      this.transitionsService.disableStudioMode();
    } else {
      this.transitionsService.enableStudioMode();
    }
  }

  get studioModeEnabled() {
    return this.transitionsService.state.studioMode;
  }

  dashboardOpening = false;

  @throttle(2000, { trailing: false })
  async openDashboard(page?: string) {
    if (this.dashboardOpening) return;
    this.dashboardOpening = true;

    try {
      const link = await this.magicLinkService.getDashboardMagicLink(page);
      electron.remote.shell.openExternal(link);
    } catch (e) {
      console.error('Error generating dashboard magic link', e);
    }

    this.dashboardOpening = false;
  }

  openHelp() {
    electron.remote.shell.openExternal('https://howto.streamlabs.com/');
  }

  async upgradeToPrime() {
    const link = await this.magicLinkService.getDashboardMagicLink(
      'prime-marketing',
      'slobs-side-nav',
    );
    electron.remote.shell.openExternal(link);
  }

  render() {
    return (
      <div class={styles.bottomTools}>
        {this.isDevMode && (
          <div class={styles.cell} onClick={() => this.openDevTools()} title={'Dev Tools'}>
            <i class="icon-developer" />
          </div>
        )}
        {this.userService.views.isLoggedIn && !this.userService.views.isPrime && (
          <div
            class={cx(styles.cell, styles.primeCell)}
            onClick={() => this.upgradeToPrime()}
            vTrackClick={{ component: 'NavTools', target: 'prime' }}
            title={$t('Get Prime')}
          >
            <i class="icon-prime" />
          </div>
        )}
        {this.userService.isLoggedIn && (
          <div
            class={cx(styles.cell)}
            onClick={() => this.openDashboard()}
            title={$t('Dashboard')}
            vTrackClick={{ component: 'NavTools', target: 'dashboard' }}
          >
            <i class="icon-dashboard" />
          </div>
        )}
        {this.userService.isLoggedIn && (
          <div
            class={cx(styles.cell)}
            onClick={() => this.openDashboard('cloudbot')}
            title={$t('Cloudbot')}
            vTrackClick={{ component: 'NavTools', target: 'cloudbot' }}
          >
            <i class="icon-cloudbot" />
          </div>
        )}
        <div
          class={styles.cell}
          onClick={() => this.navigate('LayoutEditor')}
          title={$t('Layout Editor')}
          vTrackClick={{ component: 'NavTools', target: 'layout-editor' }}
        >
          <i class="fas fa-th-large" />
        </div>
        <div
          class={cx(styles.cell, { [styles.toggleOn]: this.studioModeEnabled })}
          onClick={this.studioMode.bind(this)}
          title={$t('Studio Mode')}
          vTrackClick={{ component: 'NavTools', target: 'studio-mode' }}
        >
          <i class="icon-studio-mode-3" />
        </div>
        <div
          class={styles.cell}
          onClick={() => this.openHelp()}
          title={$t('Get Help')}
          vTrackClick={{ component: 'NavTools', target: 'help' }}
        >
          <i class="icon-question" />
        </div>
        <div
          class={styles.cell}
          onClick={() => this.openSettingsWindow()}
          title={$t('Settings')}
          vTrackClick={{ component: 'NavTools', target: 'settings' }}
        >
          <i class="icon-settings" />
        </div>
      </div>
    );
  }
}
