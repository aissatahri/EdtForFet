import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Pokemon } from '../pokemon';
import { PokemonService } from '../pokemon.service';
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-detail-pokemon',
  templateUrl: './detail-pokemon.component.html',
  styleUrls: ['./detail-pokemon.component.css']
})
export class DetailPokemonComponent implements OnInit {


  pokemonList : Pokemon[];
  pokemon : Pokemon|undefined;

  constructor(
    private route : ActivatedRoute,
    private router : Router,
    private pokemonService : PokemonService,
    private http : HttpClient
  ) { }

  ngOnInit(): void {
    const pokemonId : string|null = this.route.snapshot.paramMap.get('id')
    if (pokemonId){
      this.pokemonService.getPokemonById(+pokemonId).subscribe(pokemon => this.pokemon = pokemon)
    }

  }
  toBack() {
    this.router.navigate(['/pokemons'])
  }

  goDeleteToPokemon(pokemon : Pokemon){
    this.pokemonService.deletePokemon(pokemon.id).subscribe(
      ()=> this.toBack()
    );
  }

  goEditToPokemon(pokemon : Pokemon){
    console.log(pokemon.id)
    this.router.navigate(['/edit/pokemon', pokemon.id])
  }
}
