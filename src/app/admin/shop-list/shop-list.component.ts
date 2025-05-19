// admin/shop-list/shop-list.component.ts
import { Component, OnInit } from '@angular/core';
import { ShopService } from '../../services/shop.service';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { HomeContentService } from '../../services/homeservices';
@Component({
  selector: 'app-admin-shop-list',
  standalone:true,
  templateUrl: './shop-list.component.html',
  imports: [CommonModule,FormsModule],
  styleUrls: ['./shop-list.component.scss']
})
export class AdminShopListComponent implements OnInit {
  shops: any[] = [];
  newShop = {
    name: '',
    latitude: 0,
    longitude: 0,
    products: '',
    whatsappNumber: ''
  };
    // Sections data for Hero, About, etc.
    heroSectionData = {
      title: '',
      description: ''
    };
    aboutProductData = {
      title: '',
      description: ''
    };
    howItWorksData = {
      title: '',
      description:'',
      steps: [
        {
          number: "01",
          title: "Find nearby shops",
          description: "Locate shops within 2km selling 'you x 0.8'."
        },
        {
          number: "02",
          title: "Get directions instantly",
          description: "Receive immediate guidance on how to reach the nearest store."
        },
        {
          number: "03",
          title: "WhatsApp to order",
          description: "Order via WhatsApp easily without needing a delivery app."
        },
        {
          number: "04",
          title: "Pick up locally",
          description: "Avoid delivery fees while supporting local stores."
        }
      ]
    }
    
    forShopOwnersData = {
      title: '',
      description: ''
    };
    whyProteinMattersData = {
      title: '',
      description: ''
    };
  

  constructor(private shopService: ShopService,private homeContentService: HomeContentService) {}

  ngOnInit(): void {
    this.shopService.getShops().subscribe((data) => {
      this.shops = data;
    });
  }

  addShop() {
    const shopToAdd = {
      ...this.newShop,
      products: this.newShop.products.split(',').map(p => p.trim())
    };
    this.shopService.addShop(shopToAdd).then(() => {
      this.newShop = { name: '', latitude: 0, longitude: 0, products: '', whatsappNumber: '' };
    });
  }

  deleteShop(id: string) {
    this.shopService.deleteShop(id);
  }
  updateHeroSection() {
    this.homeContentService.setHeroSection(this.heroSectionData)
      .then(() => {
        alert('Hero section updated successfully!');
        this.heroSectionData = { title: '', description: '' };  // Reset the form
      })
      .catch((error) => {
        console.error('Error updating hero section:', error);
      });
  }

  // Update About Product Section
  updateAboutProduct() {
    this.homeContentService.setAboutProduct(this.aboutProductData)
      .then(() => {
        alert('About Product section updated successfully!');
        this.aboutProductData = { title: '', description: '' };  // Reset the form
      })
      .catch((error) => {
        console.error('Error updating about product section:', error);
      });
  }

  // Update How It Works Section
  updateHowItWorks() {
    this.homeContentService.setHowItWorks(this.howItWorksData)
      .then(() => {
        alert('How It Works section updated successfully!');
        this.howItWorksData = {
          title: '',
          description:'',
          steps: [
            { number: '01', title: '', description: '' },
            { number: '02', title: '', description: '' },
            { number: '03', title: '', description: '' },
            { number: '04', title: '', description: '' }
          ]
        };  // Reset the form
      })
      .catch((error) => {
        console.error('Error updating how it works section:', error);
      });
  }

  // Update For Shop Owners Section
  updateForShopOwners() {
    this.homeContentService.setForShopOwners(this.forShopOwnersData)
      .then(() => {
        alert('For Shop Owners section updated successfully!');
        this.forShopOwnersData = { title: '', description: '' };  // Reset the form
      })
      .catch((error) => {
        console.error('Error updating for shop owners section:', error);
      });
  }

  // Update Why Protein Matters Section
  updateWhyProteinMatters() {
    this.homeContentService.setWhyProteinMatters(this.whyProteinMattersData)
      .then(() => {
        alert('Why Protein Matters section updated successfully!');
        this.whyProteinMattersData = { title: '', description: '' };  // Reset the form
      })
      .catch((error) => {
        console.error('Error updating why protein matters section:', error);
      });
  }
}

