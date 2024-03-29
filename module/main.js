import KW_WarfareUnitSheet, {KW_ANCESTRY, KW_EQUIPMENT, KW_EXPERIENCE, KW_TYPE} from './sheet.js';
import extendActor from './unit.js';

Hooks.on('init', () => {
	loadTemplates(['modules/kw-warfare/templates/trait.hbs']);
	Actors.registerSheet('dnd5e', KW_WarfareUnitSheet, {
		types: ['npc'],
		makeDefault: false,
		label: 'KW_WARFARE.Sheet'
	});
	extendActor();
});

Hooks.on("dropActorSheetData", (actor, sheet, itemInfo) => {
	if (KW_WarfareUnitSheet.name !== sheet.constructor.name) {
		return;
	}
	//overwrite existing experience/ancestry/equipment/type if already exist
	//delete old trait. clear out text value.

	const item = game.items.get(itemInfo.id);
	if (!item) {
		return;
	}

	const requirements = item.data.data.requirements;
	if (!requirements) {
		return;
	}
	if (requirements === KW_ANCESTRY) {
		actor.setFlag('kw-warfare', 'details.ancestry', item.name);
		cleanDetails(actor, 'ancestry', KW_ANCESTRY);
	} else if (requirements === KW_EQUIPMENT) {
		actor.setFlag('kw-warfare', 'details.equipment', item.name);
		cleanDetails(actor, 'equipment', KW_EQUIPMENT);
	} else if (requirements === KW_EXPERIENCE) {
		actor.setFlag('kw-warfare', 'details.experience', item.name);
		cleanDetails(actor, 'experience', KW_EXPERIENCE);
	} else if (requirements === KW_TYPE) {
		actor.setFlag('kw-warfare', 'details.type', item.name);
		cleanDetails(actor, 'type', KW_TYPE);
	}
});

Hooks.on('preUpdateActor', (actor, updatedFlags) => {
	if (!updatedFlags || actor.sheet?.constructor.name !== KW_WarfareUnitSheet.name) {
		return;
	}

	//If updating the max-hp, reduce current hp to that max if greater than the new max
	if(updatedFlags.data && updatedFlags.data.attributes
		&& updatedFlags.data.attributes.hp && updatedFlags.data.attributes.hp.max) {
		const newMax = updatedFlags.data.attributes.hp.max;
		const currentHp = actor.data.data.attributes.hp.value;
		if(currentHp > newMax) {
			updatedFlags.data.attributes.hp.value = newMax;
		}
	}

	//if manually entering an experience/ancestry/equipment/type
	//delete old trait if exists
	if(updatedFlags.flags && updatedFlags.flags['kw-warfare'] && updatedFlags.flags['kw-warfare'].details) {
		const updatedDetails = updatedFlags.flags['kw-warfare'].details;
		if (Object.keys(updatedDetails).length !== 1) {
			return;
		}
		const updatedKey = Object.keys(updatedDetails)[0];
		if (updatedKey === 'ancestry') {
			cleanDetails(actor, 'ancestry', KW_ANCESTRY);
		} else if (updatedKey === 'equipment') {
			cleanDetails(actor, 'equipment', KW_EQUIPMENT);
		} else if (updatedKey === 'experience') {
			cleanDetails(actor, 'experience', KW_EXPERIENCE);
		} else if (updatedKey === 'type') {
			cleanDetails(actor, 'type', KW_TYPE);
		}
	}
});

function cleanDetails(actor, detailName, detailType) {
	const existingTrait = actor.items.find((i) => {
		return i.data.data.requirements === detailType;
	})
	if (existingTrait) {
		actor.items.delete(existingTrait.id)
	}
}

Handlebars.registerHelper('number-format', function (n, options) {
	if (n == null) {
		return '';
	}

	const places = options.hash.decimals || 0;
	const sign = !!options.hash.sign;
	n = parseFloat(n).toFixed(places);
	return sign && n >= 0 ? '+' + n : n;
});

Handlebars.registerHelper('or', function (...args) {
	args.pop();
	return args.reduce((acc, x) => acc || !!x);
});

document.addEventListener('click', evt => {
	const target = evt.target;
	const parent = evt.target.parentElement;

	if (!target.classList.contains('kw-warfare-config-rm-item')
		&& !parent?.classList.contains('kw-warfare-config-rm-item')) {
		$('.kw-warfare-config-rm-item.kw-warfare-alert').removeClass('kw-warfare-alert');
	}
});
