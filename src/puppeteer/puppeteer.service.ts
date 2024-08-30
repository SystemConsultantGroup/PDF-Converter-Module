import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PuppeteerService implements OnModuleInit, OnModuleDestroy {
  private browser: puppeteer.Browser;
  private page: puppeteer.Page;

  async onModuleInit() {
    console.log('module initiated');
    this.browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--allow-file-access-from-files',
        '--enable-local-file-accesses',
      ],
    });
    console.log('browser launched');
    this.page = await this.browser.newPage();
    console.log('puppeteer initiated');
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async generatePDF(htmlContent: string): Promise<Uint8Array> {
    const options = {
      width: '16.5in',
      height: '23.4in',
      preferCSSPageSize: false,
      printBackground: true,
    };
    await this.page.setContent(htmlContent);
    return await this.page.pdf(options);
  }
}
